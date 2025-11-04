import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";

import path from "path";
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
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const passwordHash = await bcrypt.hash(userData.passwordHash!, 10);
      const user = await storage.createUser({
        ...userData,
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
      };

      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      console.log("Error obteniendo productos de BD, usando datos mock:", error);
      // ... (Tu fallback de datos mock)
      
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
        stock 
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
        stock: parseInt(stock, 10)
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
      const { id, sellerId, ...updates } = req.body;
      const updatedProduct = await storage.updateProduct(req.params.id, updates);
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
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seller profile", error });
    }
  });
  
  app.post("/api/seller/profile", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'buyer') {
        return res.status(400).json({ message: "Only buyers can become sellers" });
      }
      const profileData = { ...req.body, userId: req.user.id };
      const profile = await storage.createSellerProfile(profileData);
      await storage.updateUser(req.user.id, { role: 'seller' });
      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: "Failed to create seller profile", error });
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


  const httpServer = createServer(app);
  return httpServer;
}