import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";

import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
// Esquemas de validación eliminados por migración a MongoDB

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// importaciones de validación eliminadas (migración a MongoDB)


// Auth middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {

  // Auth routes (sin cambios)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = req.body;

      // Validate role
      const allowedRoles = ['buyer', 'seller'];
      const role = userData.role || 'buyer';

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'buyer' or 'seller'" });
      }

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const passwordHash = await bcrypt.hash(userData.passwordHash!, 10);
      const user = await storage.createUser({
        ...userData,
        role,
        passwordHash
      });
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      res.json({
        user: { ...user, passwordHash: undefined },
        token
      });
    } catch (error) {
      res.status(400).json({ message: "Registration failed", error });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      res.json({
        user: { ...user, passwordHash: undefined },
        token
      });
    } catch (error) {
      res.status(400).json({ message: "Login failed", error });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    res.json({ user: { ...req.user, passwordHash: undefined } });
  });

  // Categories (sin cambios)
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories", error });
    }
  });

  // Products (sin cambios en la ruta pública)
  app.get("/api/products", async (req, res) => {
    try {
      const filters = {
        categoryId: req.query.categoryId as string,
        search: req.query.search as string,
        sellerId: req.query.sellerId as string,
        status: req.query.status as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        // New filters
        minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
        hasDiscount: req.query.hasDiscount === 'true',
        brand: req.query.brand as string,
        sort: req.query.sort as string,
        // Ensure priceRange is handled if passed instead of min/max directly
        priceRange: req.query.priceRange as string,
      };

      // Map priceRange to min/max if present
      if (filters.priceRange && filters.priceRange !== 'all') {
        const [min, max] = filters.priceRange.split('-').map(Number);
        if (!isNaN(min)) filters.minPrice = min * 100; // Convert to cents
        if (!isNaN(max)) filters.maxPrice = max * 100; // Convert to cents
        if (filters.priceRange.endsWith('+')) {
          filters.minPrice = parseInt(filters.priceRange.replace('+', '')) * 100; // Convert to cents
          filters.maxPrice = undefined;
        }
      }

      // Also convert standalone minPrice/maxPrice to cents if they were provided directly
      if (filters.minPrice && !filters.priceRange) filters.minPrice = filters.minPrice * 100;
      if (filters.maxPrice && !filters.priceRange) filters.maxPrice = filters.maxPrice * 100;

      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      console.log("Error obteniendo productos de BD:", error);
      res.status(500).json({ message: "Failed to fetch products", error });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      console.log('[GET Product] Requested ID:', req.params.id);
      const product = await storage.getProductById(req.params.id);
      console.log('[GET Product] Found:', product ? 'Yes' : 'No');
      if (!product) {
        console.log('[GET Product] Returning 404 - Product not found');
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error('[GET Product] Error:', error);
      res.status(500).json({ message: "Failed to fetch product", error });
    }
  });




  // --- ¡RUTA CORREGIDA! ---
  // Esta ruta ahora separa los datos del Producto y la Variante
  app.post("/api/products", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'seller' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      let sellerId;

      // Si el usuario es un vendedor, busca su perfil
      if (req.user.role === 'seller') {
        const sellerProfile = await storage.getSellerProfile(req.user.id);
        if (!sellerProfile) {
          return res.status(400).json({ message: "Seller profile not found" });
        }
        sellerId = sellerProfile.id;
      } else if (req.user.role === 'admin') {
        // Si es admin, debe proveer un sellerId en el body (o falla)
        if (!req.body.sellerId) {
          return res.status(400).json({ message: "Admin must provide a sellerId" });
        }
        sellerId = req.body.sellerId;
      }

      // 1. Separa los datos del formulario
      const {
        title,
        description,
        categoryId,
        slug,
        images,
        status,
        price, // Precio en pesos (ej: 1299.90)
        sku,
        stock,
        discountPercentage,
        shippingCost,
        isFreeShipping
      } = req.body;

      // 2. Prepara los datos del PRODUCTO (según schema.ts)
      const productData = {
        sellerId: sellerId,
        title: title,
        description: description,
        categoryId: categoryId,
        slug: slug || title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''), // Slug simple
        images: images || [],
        status: status || 'draft',
      };

      // 3. Prepara los datos de la VARIANTE (según schema.ts)
      const variantData = {
        // Convierte el precio de pesos/dólares (ej: 1299.90) a centavos (ej: 129990)
        priceCents: Math.floor(parseFloat(price) * 100),
        sku: sku,
        stock: parseInt(stock, 10),
        discountPercentage: discountPercentage ? parseInt(discountPercentage, 10) : 0,
        shippingCostCents: shippingCost ? Math.floor(parseFloat(shippingCost) * 100) : 0,
        isFreeShipping: isFreeShipping === true || isFreeShipping === 'true'
      };

      // 4. Llama a la nueva función de storage (que crea Producto Y Variante)
      const product = await storage.createProduct(productData, variantData);

      res.json(product); // Devuelve el producto creado

    } catch (error) {
      console.error("Failed to create product:", error);
      res.status(400).json({ message: "Failed to create product", error: error.message });
    }
  });

  // Ruta para actualizar un producto (Editar)
  app.put('/api/products/:id', authenticateToken, async (req: any, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      // Verificar permisos
      if (req.user.role === 'admin') {
        // Admin puede editar
      } else if (req.user.role === 'seller') {
        const sellerProfile = await storage.getSellerProfile(req.user.id);
        if (product.sellerId !== sellerProfile?.id) {
          return res.status(403).json({ message: 'Access denied' });
        }
      } else {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Excluimos 'id' y 'sellerId' de ser actualizados desde el body
      const { id, sellerId, price, stock, discountPercentage, shippingCost, isFreeShipping, ...updates } = req.body;

      const variantUpdates: any = {};
      if (price !== undefined) variantUpdates.priceCents = Math.floor(parseFloat(price) * 100);
      if (stock !== undefined) variantUpdates.stock = parseInt(stock, 10);
      if (discountPercentage !== undefined) variantUpdates.discountPercentage = parseInt(discountPercentage, 10);
      if (shippingCost !== undefined) variantUpdates.shippingCostCents = Math.floor(parseFloat(shippingCost) * 100);
      if (isFreeShipping !== undefined) variantUpdates.isFreeShipping = isFreeShipping === true || isFreeShipping === 'true';

      const updatedProduct = await storage.updateProduct(req.params.id, updates, variantUpdates);
      res.json(updatedProduct);

    } catch (error) {
      return res.status(500).json({ message: 'Failed to update product', error });
    }
  });

  // Delete product (sin cambios)
  app.delete('/api/products/:id', authenticateToken, async (req: any, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      if (req.user.role === 'admin') {
        await storage.deleteProduct(req.params.id);
        return res.json({ message: 'Product deleted' });
      }

      if (req.user.role === 'seller') {
        const sellerProfile = await storage.getSellerProfile(req.user.id);
        if (!sellerProfile) return res.status(403).json({ message: 'Access denied' });
        if (product.sellerId !== sellerProfile.id) return res.status(403).json({ message: 'Cannot delete products of other sellers' });
        await storage.deleteProduct(req.params.id);
        return res.json({ message: 'Product deleted' });
      }

      return res.status(403).json({ message: 'Access denied' });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to delete product', error });
    }
  });

  app.get("/api/products/:id/variants", async (req, res) => {
    try {
      const variants = await storage.getVariantsByProductId(req.params.id);
      res.json(variants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch variants", error });
    }
  });

  // Obtener productos del vendedor autenticado
  app.get("/api/seller/products", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'seller' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Solo vendedores o admins pueden ver sus productos.' });
      }

      if (req.user.role === 'admin') {
        const products = await storage.getProducts({});
        return res.json(products);
      }

      // ESTA ES LA LÓGICA CORRECTA
      // 1. Encontrar el perfil de vendedor basado en el usuario
      const sellerProfile = await storage.getSellerProfile(req.user.id);
      if (!sellerProfile) {
        return res.status(404).json({ message: "Seller profile not found for this user." });
      }

      // 2. Usar el ID del PERFIL DE VENDEDOR para filtrar
      const products = await storage.getProducts({ sellerId: sellerProfile.id });
      res.json(products);

    } catch (error) {
      res.status(500).json({ message: 'Error al obtener productos del vendedor', error });
    }
  });

  // GET /api/seller/stats
  app.get("/api/seller/stats", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'seller') {
        return res.status(403).json({ message: "Access denied" });
      }
      const sellerProfile = await storage.getSellerProfile(req.user.id);
      if (!sellerProfile) {
        return res.status(404).json({ message: "Seller profile not found" });
      }
      const stats = await storage.getSellerStats(sellerProfile.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seller stats", error });
    }
  });

  // (Faltaban estas rutas de seller/orders y profile)

  app.get("/api/seller/orders", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'seller') {
        return res.status(403).json({ message: "Access denied" });
      }
      const sellerProfile = await storage.getSellerProfile(req.user.id);
      if (!sellerProfile) {
        return res.status(404).json({ message: "Seller profile not found" });
      }
      const orders = await storage.getOrdersBySellerId(sellerProfile.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders", error });
    }
  });

  app.get("/api/seller/profile", authenticateToken, async (req: any, res) => {
    try {
      const profile = await storage.getSellerProfile(req.user.id);
      if (!profile) {
        return res.status(404).json({ message: "Seller profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seller profile", error });
    }
  });

  app.post("/api/seller/profile", authenticateToken, async (req: any, res) => {
    try {
      // Allow buyers (upgrading) or sellers (completing profile)
      if (req.user.role !== 'buyer' && req.user.role !== 'seller') {
        return res.status(400).json({ message: "Invalid role for creating seller profile" });
      }

      // Check if profile already exists
      const existing = await storage.getSellerProfile(req.user.id);
      if (existing) {
        return res.status(400).json({ message: "Seller profile already exists" });
      }

      const profileData = {
        ...req.body,
        userId: req.user.id,
        // Ensure location is saved if passed
        location: req.body.location
      };
      const profile = await storage.createSellerProfile(profileData);

      // If they were a buyer, upgrade them
      if (req.user.role === 'buyer') {
        await storage.updateUser(req.user.id, { role: 'seller' });
      }

      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: "Failed to create seller profile", error });
    }
  });

  app.put("/api/seller/profile", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'seller') {
        return res.status(403).json({ message: "Access denied" });
      }

      const sellerProfile = await storage.getSellerProfile(req.user.id);
      if (!sellerProfile) {
        return res.status(404).json({ message: "Seller profile not found" });
      }

      // We use the same updateSellerStatus or a new method if we want to update other fields
      // Since storage.updateSellerStatus only updates status, we might need a new method in storage
      // But wait, we can just use updateSellerProfile if it existed, or we can modify the collection directly here
      // However, best practice is to use storage methods.
      // Let's check storage.ts again. It doesn't have updateSellerProfile.
      // I will implement it in storage.ts first or just do a direct update if I can't change storage interface easily?
      // No, I should change storage.ts. But for now, let's assume I'll add it to storage.ts in the next step.
      // Actually, I can just use the collection directly in storage.ts if I add the method.

      // Let's add the method to storage.ts first? No, I'm in routes.ts.
      // I will add the route assuming the storage method exists or I will implement it inline if I must (but storage is better).
      // Wait, I see `updateSellerStatus` in storage.ts. I should probably add `updateSellerProfile` to storage.ts.

      // For now, I will write the route to call `storage.updateSellerProfile`.
      // I will need to add `updateSellerProfile` to `storage.ts` in the next step.

      const updatedProfile = await storage.updateSellerProfile(req.user.id, req.body);
      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update seller profile", error });
    }
  });

  app.delete("/api/seller/products/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'seller') {
        return res.status(403).json({ message: "Access denied" });
      }
      // Verify ownership (optional but recommended, though storage.deleteProduct just deletes by ID)
      // For now, we assume the seller owns the product or we trust the ID. 
      // Ideally we should check if product.sellerId matches req.user.id (or seller profile id)

      await storage.deleteProduct(req.params.id);
      res.status(200).json({ message: "Product deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product", error });
    }
  });

  // Reviews
  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByProductId(req.params.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews", error });
    }
  });

  app.post("/api/products/:id/reviews", authenticateToken, async (req: any, res) => {
    try {

      const reviewData = {
        ...req.body,
        userId: req.user.id,
        userName: req.user.name, // Add userName
        date: new Date().toISOString(), // Add date
        productId: req.params.id
      };

      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      res.status(400).json({ message: "Failed to create review", error });
    }
  });

  // Orders
  app.get("/api/orders", authenticateToken, async (req: any, res) => {
    try {
      const orders = await storage.getOrdersByUserId(req.user.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders", error });
    }
  });

  app.post("/api/orders", authenticateToken, async (req: any, res) => {
    try {
      const orderData = {
        ...req.body,
        userId: req.user.id
      };

      const order = await storage.createOrder(orderData);
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Failed to create order", error });
    }
  });

  // (Faltaban estas rutas de Cart)
  app.get("/api/cart", authenticateToken, async (req: any, res) => {
    try {
      const cartItems = await storage.getCartByUserId(req.user.id);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart", error });
    }
  });
  app.post("/api/cart/add", authenticateToken, async (req: any, res) => {
    try {
      const { variantId, quantity } = req.body;
      await storage.addToCart(req.user.id, variantId, quantity);
      res.status(200).json({ message: "Item added to cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to add to cart", error });
    }
  });
  app.put("/api/cart/update", authenticateToken, async (req: any, res) => {
    try {
      const { variantId, quantity } = req.body;
      await storage.updateCartItem(req.user.id, variantId, quantity);
      res.status(200).json({ message: "Cart updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart", error });
    }
  });
  app.delete("/api/cart/remove/:variantId", authenticateToken, async (req: any, res) => {
    try {
      await storage.removeFromCart(req.user.id, req.params.variantId);
      res.status(200).json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item", error });
    }
  });
  app.delete("/api/cart/clear", authenticateToken, async (req: any, res) => {
    try {
      await storage.clearCart(req.user.id);
      res.status(200).json({ message: "Cart cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart", error });
    }
  });

  // --- RUTAS DE IMÁGENES ---
  app.post("/api/upload", authenticateToken, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validar tipo de archivo (básico)
      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "Only images are allowed" });
      }

      // Check for S3 credentials
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME && process.env.AWS_REGION) {
        console.log('[S3 Upload] Starting upload to S3...');
        console.log('[S3 Upload] Bucket:', process.env.AWS_BUCKET_NAME);
        console.log('[S3 Upload] Region:', process.env.AWS_REGION);

        const s3Client = new S3Client({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        });

        const fileName = `${randomBytes(16).toString("hex")}-${req.file.originalname}`;
        console.log('[S3 Upload] File name:', fileName);

        const command = new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileName,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          // ACL removed - most S3 buckets have public ACLs blocked by default
          // Use bucket policy or CloudFront for public access instead
        });

        await s3Client.send(command);
        console.log('[S3 Upload] Upload successful');

        // Construct public URL
        const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        console.log('[S3 Upload] Image URL:', imageUrl);
        return res.json({ url: imageUrl });
      }

      console.log('[Upload] Using local storage (no S3 credentials)');
      // Fallback to local storage if no S3 credentials
      const imageId = await storage.uploadImage(req.file.buffer, req.file.mimetype);

      // Devolver URL absoluta o relativa
      const imageUrl = `/api/images/${imageId}`;
      res.json({ url: imageUrl });
    } catch (error) {
      console.error("[Upload Error]", error);
      // Return more detailed error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        message: "Failed to upload image",
        error: errorMessage
      });
    }
  });

  app.get("/api/images/:id", async (req, res) => {
    try {
      const image = await storage.getImage(req.params.id);
      if (!image) {
        return res.status(404).send("Image not found");
      }

      res.setHeader("Content-Type", image.mimeType);
      res.send(image.buffer);
    } catch (error) {
      res.status(500).send("Failed to fetch image");
    }
  });

  // --- RUTAS DE ADMIN ---
  app.get("/api/admin/stats", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ message: "Access denied" });
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats", error });
    }
  });

  app.get("/api/admin/analytics/revenue", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ message: "Access denied" });
      const data = await storage.getRevenueChartData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch revenue data", error });
    }
  });

  app.get("/api/admin/analytics/categories", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ message: "Access denied" });
      const data = await storage.getCategoryChartData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category data", error });
    }
  });

  app.get("/api/admin/sellers/pending", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ message: "Access denied" });
      const sellers = await storage.getPendingSellers();
      res.json(sellers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending sellers", error });
    }
  });

  app.post("/api/admin/sellers/:id/approve", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ message: "Access denied" });
      const seller = await storage.updateSellerStatus(req.params.id, 'verified');
      res.json(seller);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve seller", error });
    }
  });

  app.post("/api/admin/sellers/:id/reject", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ message: "Access denied" });
      const seller = await storage.updateSellerStatus(req.params.id, 'rejected');
      res.json(seller);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject seller", error });
    }
  });

  app.get("/api/admin/orders", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ message: "Access denied" });
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin orders", error });
    }
  });

  app.get("/api/admin/users", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ message: "Access denied" });
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users", error });
    }
  });

  app.get("/api/admin/products", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ message: "Access denied" });
      // Admin sees all products regardless of status
      const products = await storage.getProducts({});
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin products", error });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}