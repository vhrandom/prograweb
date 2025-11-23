import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";
import multer from "multer";

// --- Tipos y Extensiones ---
interface AuthRequest extends Request {
  user?: any;
}

const upload = multer({ storage: multer.memoryStorage() });
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// --- Middleware Helpers ---

const asyncHandler = (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
  };

const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireRole = (allowedRoles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

const parseProductFilters = (query: any) => {
  const filters: any = {
    categoryId: query.categoryId,
    search: query.search,
    sellerId: query.sellerId,
    status: query.status,
    limit: query.limit ? parseInt(query.limit) : 20,
    offset: query.offset ? parseInt(query.offset) : 0,
    brand: query.brand,
    sort: query.sort,
    hasDiscount: query.hasDiscount === 'true',
    minPrice: query.minPrice ? parseInt(query.minPrice) * 100 : undefined,
    maxPrice: query.maxPrice ? parseInt(query.maxPrice) * 100 : undefined,
    slug: query.slug,
    id: query.id
  };

  if (query.priceRange && query.priceRange !== 'all') {
    if (query.priceRange.endsWith('+')) {
      filters.minPrice = parseInt(query.priceRange.replace('+', '')) * 100;
      filters.maxPrice = undefined;
    } else {
      const [min, max] = query.priceRange.split('-').map(Number);
      if (!isNaN(min)) filters.minPrice = min * 100;
      if (!isNaN(max)) filters.maxPrice = max * 100;
    }
  }
  return filters;
};

export async function registerRoutes(app: Express): Promise<Server> {

  // --- Auth Routes ---
  app.post("/api/auth/register", asyncHandler(async (req, res) => {
    const userData = req.body;
    const role = userData.role || 'buyer';

    if (!['buyer', 'seller'].includes(role)) return res.status(400).json({ message: "Invalid role" });
    if (await storage.getUserByEmail(userData.email)) return res.status(400).json({ message: "User already exists" });

    const passwordHash = await bcrypt.hash(userData.passwordHash!, 10);
    const user = await storage.createUser({ ...userData, role, passwordHash });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ user: { ...user, passwordHash: undefined }, token });
  }));

  app.post("/api/auth/login", asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);

    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { ...user, passwordHash: undefined }, token });
  }));

  app.get("/api/auth/me", authenticateToken, (req, res) => {
    res.json({ user: { ...req.user, passwordHash: undefined } });
  });

  // --- Public Data ---
  app.get("/api/categories", asyncHandler(async (req, res) => {
    res.json(await storage.getCategories());
  }));

  app.get("/api/products", asyncHandler(async (req, res) => {
    const filters = parseProductFilters(req.query);
    res.json(await storage.getProducts(filters));
  }));

  app.get("/api/products/:id", asyncHandler(async (req, res) => {
    const product = await storage.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  }));

  app.get("/api/products/:id/variants", asyncHandler(async (req, res) => {
    res.json(await storage.getVariantsByProductId(req.params.id));
  }));

  app.get("/api/products/:id/reviews", asyncHandler(async (req, res) => {
    let productId = req.params.id;
    // Resolver slug a ID si es necesario
    if (!ObjectId.isValid(productId)) {
      const product = await storage.getProductBySlug(productId);
      if (product) productId = product.id;
    }
    res.json(await storage.getReviewsByProductId(productId));
  }));

  // --- Protected Product Management ---
  app.post("/api/products", authenticateToken, requireRole(['seller', 'admin']), asyncHandler(async (req, res) => {
    let sellerId = req.user.role === 'admin' ? req.body.sellerId : null;

    if (req.user.role === 'seller') {
      const profile = await storage.getSellerProfile(req.user.id);
      if (!profile) return res.status(400).json({ message: "Seller profile required" });
      sellerId = profile.id;
    }

    if (!sellerId) return res.status(400).json({ message: "Seller ID missing" });

    const { title, description, categoryId, slug, images, status, price, sku, stock, discountPercentage, shippingCost, isFreeShipping } = req.body;

    const productData = {
      sellerId,
      title,
      description,
      categoryId,
      slug: slug || title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
      images: images || [],
      status: status || 'draft',
    };

    const variantData = {
      priceCents: Math.floor(parseFloat(price) * 100),
      sku,
      stock: parseInt(stock, 10),
      discountPercentage: parseInt(discountPercentage || 0, 10),
      shippingCostCents: (isFreeShipping === true || isFreeShipping === 'true') ? 0 : Math.floor(parseFloat(shippingCost || 0) * 100),
      isFreeShipping: isFreeShipping === true || isFreeShipping === 'true'
    };

    const product = await storage.createProduct(productData, variantData);
    res.json(product);
  }));

  app.put('/api/products/:id', authenticateToken, requireRole(['seller', 'admin']), asyncHandler(async (req, res) => {
    const product = await storage.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.user.role === 'seller') {
      const profile = await storage.getSellerProfile(req.user.id);
      if (product.sellerId !== profile?.id) return res.status(403).json({ message: 'Access denied' });
    }

    const { id, sellerId, price, stock, discountPercentage, shippingCost, isFreeShipping, ...updates } = req.body;

    const variantUpdates: any = {};
    if (price !== undefined) variantUpdates.priceCents = Math.floor(parseFloat(price) * 100);
    if (stock !== undefined) variantUpdates.stock = parseInt(stock, 10);
    if (discountPercentage !== undefined) variantUpdates.discountPercentage = parseInt(discountPercentage, 10);
    if (shippingCost !== undefined) variantUpdates.shippingCostCents = Math.floor(parseFloat(shippingCost) * 100);
    if (isFreeShipping !== undefined) variantUpdates.isFreeShipping = String(isFreeShipping) === 'true';

    res.json(await storage.updateProduct(req.params.id, updates, variantUpdates));
  }));

  app.delete('/api/products/:id', authenticateToken, requireRole(['seller', 'admin']), asyncHandler(async (req, res) => {
    const product = await storage.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.user.role === 'seller') {
      const profile = await storage.getSellerProfile(req.user.id);
      if (product.sellerId !== profile?.id) return res.status(403).json({ message: "Not your product" });
    }

    await storage.deleteProduct(req.params.id);
    res.json({ message: 'Product deleted' });
  }));

  // --- Seller Routes ---
  app.get("/api/seller/products", authenticateToken, requireRole(['seller', 'admin']), asyncHandler(async (req, res) => {
    if (req.user.role === 'admin') return res.json(await storage.getProducts({}));

    const profile = await storage.getSellerProfile(req.user.id);
    if (!profile) return res.status(404).json({ message: "Seller profile not found" });

    res.json(await storage.getProducts({ sellerId: profile.id }));
  }));

  app.get("/api/seller/stats", authenticateToken, requireRole(['seller']), asyncHandler(async (req, res) => {
    const profile = await storage.getSellerProfile(req.user.id);
    if (!profile) return res.status(404).json({ message: "Seller profile not found" });
    res.json(await storage.getSellerStats(profile.id));
  }));

  app.get("/api/seller/orders", authenticateToken, requireRole(['seller']), asyncHandler(async (req, res) => {
    const profile = await storage.getSellerProfile(req.user.id);
    if (!profile) return res.status(404).json({ message: "Seller profile not found" });
    res.json(await storage.getOrdersBySellerId(profile.id));
  }));

  app.get("/api/seller/profile", authenticateToken, asyncHandler(async (req, res) => {
    const profile = await storage.getSellerProfile(req.user.id);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  }));

  app.post("/api/seller/profile", authenticateToken, asyncHandler(async (req, res) => {
    if (await storage.getSellerProfile(req.user.id)) return res.status(400).json({ message: "Profile already exists" });

    const profile = await storage.createSellerProfile({ ...req.body, userId: req.user.id });
    if (req.user.role === 'buyer') await storage.updateUser(req.user.id, { role: 'seller' });
    res.json(profile);
  }));

  app.put("/api/seller/profile", authenticateToken, requireRole(['seller']), asyncHandler(async (req, res) => {
    res.json(await storage.updateSellerProfile(req.user.id, req.body));
  }));

  // --- User Features ---
  app.post("/api/products/:id/reviews", authenticateToken, asyncHandler(async (req, res) => {
    let productId = req.params.id;
    if (!ObjectId.isValid(productId)) {
      const p = await storage.getProductBySlug(productId);
      if (p) productId = p.id;
    }

    const review = await storage.createReview({
      ...req.body,
      userId: req.user.id,
      userName: req.user.name,
      date: new Date().toISOString(),
      productId
    });
    res.json(review);
  }));

  app.get("/api/orders", authenticateToken, asyncHandler(async (req, res) => {
    res.json(await storage.getOrdersByUserId(req.user.id));
  }));

  app.post("/api/orders", authenticateToken, asyncHandler(async (req, res) => {
    res.json(await storage.createOrder({ ...req.body, userId: req.user.id }));
  }));

  app.get("/api/cart", authenticateToken, asyncHandler(async (req, res) => {
    res.json(await storage.getCartByUserId(req.user.id));
  }));

  app.post("/api/cart/add", authenticateToken, asyncHandler(async (req, res) => {
    await storage.addToCart(req.user.id, req.body.variantId, req.body.quantity);
    res.json({ message: "Added" });
  }));

  app.put("/api/cart/update", authenticateToken, asyncHandler(async (req, res) => {
    await storage.updateCartItem(req.user.id, req.body.variantId, req.body.quantity);
    res.json({ message: "Updated" });
  }));

  app.delete("/api/cart/remove/:variantId", authenticateToken, asyncHandler(async (req, res) => {
    await storage.removeFromCart(req.user.id, req.params.variantId);
    res.json({ message: "Removed" });
  }));

  app.delete("/api/cart/clear", authenticateToken, asyncHandler(async (req, res) => {
    await storage.clearCart(req.user.id);
    res.json({ message: "Cleared" });
  }));

  // --- File Upload ---
  app.post("/api/upload", authenticateToken, upload.single("file"), asyncHandler(async (req, res) => {
    if (!req.file || !req.file.mimetype.startsWith("image/")) return res.status(400).json({ message: "Invalid image file" });

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_BUCKET_NAME) {
      const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! },
      });
      const fileName = `${randomBytes(16).toString("hex")}-${req.file.originalname}`;
      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }));
      return res.json({ url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}` });
    }

    const imageId = await storage.uploadImage(req.file.buffer, req.file.mimetype);
    res.json({ url: `/api/images/${imageId}` });
  }));

  app.get("/api/images/:id", asyncHandler(async (req, res) => {
    const image = await storage.getImage(req.params.id);
    if (!image) return res.status(404).send("Not found");
    res.setHeader("Content-Type", image.mimeType);
    res.send(image.buffer);
  }));

  // --- Admin Routes ---
  const adminRoutes = [
    { path: "/api/admin/stats", fn: () => storage.getAdminStats() },
    { path: "/api/admin/analytics/revenue", fn: () => storage.getRevenueChartData() },
    { path: "/api/admin/analytics/categories", fn: () => storage.getCategoryChartData() },
    { path: "/api/admin/sellers/pending", fn: () => storage.getPendingSellers() },
    { path: "/api/admin/orders", fn: () => storage.getAllOrders() },
    { path: "/api/admin/users", fn: () => storage.getAllUsers() },
    { path: "/api/admin/products", fn: () => storage.getProducts({}) },
  ];

  adminRoutes.forEach(route => {
    app.get(route.path, authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
      res.json(await route.fn());
    }));
  });

  app.post("/api/admin/sellers/:id/:action", authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
    const { action } = req.params;
    if (action !== 'approve' && action !== 'reject') return res.status(400).json({ message: "Invalid action" });
    const status = action === 'approve' ? 'verified' : 'rejected';
    res.json(await storage.updateSellerStatus(req.params.id, status));
  }));

  const httpServer = createServer(app);
  return httpServer;
}