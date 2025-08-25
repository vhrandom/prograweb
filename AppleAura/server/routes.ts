import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { insertUserSchema, insertProductSchema, insertSellerProfileSchema, insertReviewSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.passwordHash!, 10);
      
      const user = await storage.createUser({
        ...userData,
        passwordHash
      });

      // Create JWT
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

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories", error });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const filters = {
        categoryId: req.query.categoryId as string,
        search: req.query.search as string,
        sellerId: req.query.sellerId as string,
        status: req.query.status as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products", error });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product", error });
    }
  });

  app.post("/api/products", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'seller' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      let sellerId = req.body.sellerId;
      
      // If user is a seller, get their profile ID
      if (req.user.role === 'seller') {
        const sellerProfile = await storage.getSellerProfile(req.user.id);
        if (!sellerProfile) {
          return res.status(400).json({ message: "Seller profile not found" });
        }
        sellerId = sellerProfile.id;
      }

      const productData = insertProductSchema.parse({
        ...req.body,
        sellerId
      });

      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Failed to create product", error });
    }
  });

  // Product variants
  app.get("/api/products/:id/variants", async (req, res) => {
    try {
      const variants = await storage.getVariantsByProductId(req.params.id);
      res.json(variants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch variants", error });
    }
  });

  // Cart
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
      res.json({ message: "Item added to cart" });
    } catch (error) {
      res.status(400).json({ message: "Failed to add to cart", error });
    }
  });

  app.put("/api/cart/update", authenticateToken, async (req: any, res) => {
    try {
      const { variantId, quantity } = req.body;
      await storage.updateCartItem(req.user.id, variantId, quantity);
      res.json({ message: "Cart updated" });
    } catch (error) {
      res.status(400).json({ message: "Failed to update cart", error });
    }
  });

  app.delete("/api/cart/remove/:variantId", authenticateToken, async (req: any, res) => {
    try {
      await storage.removeFromCart(req.user.id, req.params.variantId);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(400).json({ message: "Failed to remove from cart", error });
    }
  });

  app.delete("/api/cart/clear", authenticateToken, async (req: any, res) => {
    try {
      await storage.clearCart(req.user.id);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      res.status(400).json({ message: "Failed to clear cart", error });
    }
  });

  // Seller routes
  app.post("/api/seller/profile", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'buyer') {
        return res.status(400).json({ message: "Only buyers can become sellers" });
      }

      const profileData = insertSellerProfileSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      const profile = await storage.createSellerProfile(profileData);
      
      // Update user role
      await storage.updateUser(req.user.id, { role: 'seller' });
      
      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: "Failed to create seller profile", error });
    }
  });

  app.get("/api/seller/profile", authenticateToken, async (req: any, res) => {
    try {
      const profile = await storage.getSellerProfile(req.user.id);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seller profile", error });
    }
  });

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
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId: req.user.id,
        productId: req.params.id
      });

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

  const httpServer = createServer(app);
  return httpServer;
}
