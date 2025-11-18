import { MongoClient, Db, Collection, ObjectId } from "mongodb";
// --- MUNDO 1: SQL (Exclusivo para Usuarios) ---
import { dbSql } from "./sql";
import { users } from "shared/schema-sqlite"; 
import { eq } from "drizzle-orm";
// ---------------------------------------------

// --- INTERFACES DE LA APP (Contrato común) ---
import { 
  User, InsertUser, 
  SellerProfile, InsertSellerProfile, 
  Category, Product, InsertProduct, 
  ProductVariant, InsertProductVariant, 
  Order, InsertOrder, OrderItem, 
  Review, InsertReview, CartItem 
} from "../shared/schema"; 

import { connectMongo } from "./mongo-connection";

type MongoDoc = { id?: string, _id?: ObjectId };

// Definición estricta de métodos
export interface IStorage {
  // --- ÁREA SQL ---
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // --- ÁREA MONGO ---
  getSellerProfile(userId: string): Promise<SellerProfile | undefined>;
  createSellerProfile(profile: InsertSellerProfile): Promise<SellerProfile>;
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: any): Promise<Category>;
  getProducts(filters?: any): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct, variantData: { priceCents: number, sku: string, stock: number }): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  getVariantsByProductId(productId: string): Promise<ProductVariant[]>;
  getVariantById(id: string): Promise<ProductVariant | undefined>;
  createVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  getCartByUserId(userId: string): Promise<CartItem[]>;
  addToCart(userId: string, variantId: string, quantity: number): Promise<void>;
  updateCartItem(userId: string, variantId: string, quantity: number): Promise<void>;
  removeFromCart(userId: string, variantId: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
  getOrdersBySellerId(sellerId: string): Promise<Order[]>;
  getOrdersByUserId(userId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  getReviewsByProductId(productId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  getSellerStats(sellerId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {

  // -------------------------------------------------------------------------
  // HELPERS (Solo para MongoDB)
  // -------------------------------------------------------------------------
  private _normalize<T extends MongoDoc>(doc: T | null | undefined): T | undefined {
    if (doc && !doc.id && doc._id) {
      doc.id = doc._id.toString();
    }
    return doc ?? undefined;
  }

  private _normalizeArray<T extends MongoDoc>(docs: T[]): T[] {
    return docs.map(doc => this._normalize(doc)).filter(Boolean) as T[];
  }

  private async _findById<T extends MongoDoc>(
    collection: Collection<T>,
    id: string
  ): Promise<T | undefined> {
    if (!id || typeof id !== 'string') return undefined;
    let doc = await collection.findOne({ id: id } as any);
    if (!doc && ObjectId.isValid(id)) {
      doc = await collection.findOne({ _id: new ObjectId(id) } as any);
    }
    return this._normalize(doc);
  }

  // =========================================================================
  // ZONA SQL (SQLite) - EXCLUSIVO PARA USUARIOS
  // =========================================================================
  
  async getUser(id: string): Promise<User | undefined> {
    try {
      const idNum = parseInt(id);
      if (isNaN(idNum)) return undefined;

      // Consulta a SQLite
      const result = dbSql.select().from(users).where(eq(users.id, idNum)).all();
      
      if (result.length === 0) return undefined;
      const u = result[0];
      
      // ADAPTADOR: SQL -> APP
      return {
        id: u.id.toString(), // Convertimos ID numérico a string
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role as any,
        name: u.name || "Usuario",
        // TRUCO: Convertimos Date a Number para satisfacer a la App
        createdAt: u.createdAt ? u.createdAt.getTime() : Date.now()
      };
    } catch (error) {
      console.error("Error SQLite getUser:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = dbSql.select().from(users).where(eq(users.email, email)).all();
      
      if (result.length === 0) return undefined;
      const u = result[0];

      return {
        id: u.id.toString(),
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role as any,
        name: u.name || "Usuario",
        createdAt: u.createdAt ? u.createdAt.getTime() : Date.now()
      };
    } catch (error) {
      console.error("Error SQLite getUserByEmail:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Insertamos en SQLite
    const result = dbSql.insert(users).values({
      email: insertUser.email,
      passwordHash: insertUser.passwordHash,
      role: insertUser.role || "buyer",
      name: insertUser.name || insertUser.email.split('@')[0],
      createdAt: new Date()
    }).returning().get();

    return {
      id: result.id.toString(),
      email: result.email,
      passwordHash: result.passwordHash,
      role: result.role as any,
      name: result.name || "Usuario",
      createdAt: result.createdAt ? result.createdAt.getTime() : Date.now()
    };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const idNum = parseInt(id);
    if (isNaN(idNum)) return undefined;

    const sqlUpdates: any = {};
    if (updates.role) sqlUpdates.role = updates.role;
    if (updates.name) sqlUpdates.name = updates.name;
    if (updates.passwordHash) sqlUpdates.passwordHash = updates.passwordHash;

    if (Object.keys(sqlUpdates).length === 0) return this.getUser(id);

    const result = dbSql.update(users)
      .set(sqlUpdates)
      .where(eq(users.id, idNum))
      .returning()
      .get();

    if (!result) return undefined;
    
    return { 
        id: result.id.toString(), 
        email: result.email, 
        passwordHash: result.passwordHash,
        role: result.role as any, 
        name: result.name || "",
        createdAt: result.createdAt ? result.createdAt.getTime() : Date.now()
    };
  }

  // =========================================================================
  // ZONA MONGODB - TODO LO DEMÁS (Productos, Carrito, etc.)
  // =========================================================================
  
  // Seller Profiles (Aunque se relacionan con User, se guardan en Mongo por flexibilidad)
  async getSellerProfile(userId: string): Promise<SellerProfile | undefined> {
    const db = await connectMongo();
    const profile = await db.collection<SellerProfile>("seller_profiles").findOne({ userId });
    return this._normalize(profile);
  }
  async createSellerProfile(profile: InsertSellerProfile): Promise<SellerProfile> {
    const db = await connectMongo();
    const doc = { ...profile, id: profile.id || new ObjectId().toString() };
    await db.collection<SellerProfile>("seller_profiles").insertOne(doc);
    return doc as SellerProfile;
  }

  // Categorías
  async getCategories(): Promise<Category[]> {
    const db = await connectMongo();
    const categories = await db.collection<Category>("categories").find().toArray();
    return this._normalizeArray(categories);
  }
  async getCategoryById(id: string): Promise<Category | undefined> {
    const db = await connectMongo();
    return this._findById(db.collection<Category>("categories"), id);
  }
  async createCategory(category: { name: string; description?: string; icon?: string; parentId?: string }): Promise<Category> {
    const db = await connectMongo();
    const doc = { ...category, id: new ObjectId().toString() };
    await db.collection<Category>("categories").insertOne(doc);
    return doc as Category;
  }

  // Productos (El corazón de Mongo)
  async getProducts(filters?: any): Promise<Product[]> {
    const db = await connectMongo();
    const collection = db.collection<Product>("products");
    const query: any = {};
    if (filters?.search) {
      const searchRegex = new RegExp(filters.search, "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }
    if (filters?.category) query.categoryId = filters.category;
    if (filters?.sellerId) query.sellerId = filters.sellerId;
    if (filters?.status) query.status = filters.status;

    const products = await collection.aggregate([
      { $match: query }, 
      {
        $lookup: { 
          from: "product_variants", 
          localField: "id",          
          foreignField: "productId", 
          as: "variants"           
        }
      },
      { $addFields: { firstVariant: { $first: "$variants" } } },
      {
        $addFields: {
          variantId: "$firstVariant.id",
          price: "$firstVariant.priceCents", 
          stock: "$firstVariant.stock",
          sku: "$firstVariant.sku"
        }
      },
      { $project: { variants: 0, firstVariant: 0 } }
    ]).toArray();

    return this._normalizeArray(products as Product[]);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const db = await connectMongo();
    return this._findById(db.collection<Product>("products"), id);
  }
  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const db = await connectMongo();
    const product = await db.collection<Product>("products").findOne({ slug });
    return this._normalize(product);
  }
  async createProduct(productData: InsertProduct, variantData: { priceCents: number, sku: string, stock: number }): Promise<Product> {
    const db = await connectMongo();
    const productDoc = { ...productData, id: productData.id || new ObjectId().toString() };
    await db.collection<Product>("products").insertOne(productDoc);

    const newVariant: InsertProductVariant = {
      productId: productDoc.id,
      priceCents: variantData.priceCents,
      sku: variantData.sku,
      stock: variantData.stock,
      currency: "CLP",
      attributesJson: {}
    };
    await this.createVariant(newVariant);
    return productDoc as Product;
  }
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const db = await connectMongo();
    const collection = db.collection<Product>("products");
    const doc = await this._findById(collection, id);
    if (!doc) return undefined;

    delete updates.id;
    delete (updates as any)._id;
    
    await collection.updateOne({ _id: doc._id }, { $set: updates });
    return this._findById(collection, id);
  } 
  async deleteProduct(id: string): Promise<void> {
    const db = await connectMongo();
    await db.collection("product_variants").deleteMany({ productId: id });
    await db.collection("products").deleteOne({ id });
  }

  // Variantes
  async getVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    const db = await connectMongo();
    const variants = await db.collection<ProductVariant>("product_variants").find({ productId }).toArray();
    return this._normalizeArray(variants);
  }
  async getVariantById(id: string): Promise<ProductVariant | undefined> {
    const db = await connectMongo();
    return this._findById(db.collection<ProductVariant>("product_variants"), id);
  }
  async createVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const db = await connectMongo();
    const doc = { ...variant, id: variant.id || new ObjectId().toString() };
    await db.collection<ProductVariant>("product_variants").insertOne(doc);
    return doc as ProductVariant;
  }

  // Estadísticas
  async getSellerStats(sellerId: string): Promise<any> {
    const db = await connectMongo();
    const productCollection = db.collection<Product>("products");
    const orderCollection = db.collection<Order>("orders");

    const [totalProducts, totalOrders, pendingOrders, revenueResult] = await Promise.all([
      productCollection.countDocuments({ sellerId }),
      orderCollection.countDocuments({ sellerId }),
      orderCollection.countDocuments({ sellerId, status: "pending" }),
      orderCollection.aggregate([
        { $match: { sellerId: sellerId, status: "delivered" } },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
      ]).toArray()
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    return { totalProducts, totalOrders, pendingOrders, totalRevenue };
  }

  // Órdenes
  async getOrdersBySellerId(sellerId: string): Promise<Order[]> {
    const db = await connectMongo();
    const orders = await db.collection<Order>("orders").find({ sellerId }).sort({ createdAt: -1 }).toArray();
    return this._normalizeArray(orders);
  }
  async getOrdersByUserId(userId: string): Promise<Order[]> {
    const db = await connectMongo();
    const orders = await db.collection<Order>("orders").find({ userId }).toArray();
    return this._normalizeArray(orders);
  }
  async createOrder(order: InsertOrder): Promise<Order> {
    const db = await connectMongo();
    const doc = { ...order, id: order.id || new ObjectId().toString() };
    await db.collection<Order>("orders").insertOne(doc);
    return doc as Order;
  }

  // Reseñas
   async getReviewsByProductId(productId: string): Promise<Review[]> {
    const db = await connectMongo();
    const reviews = await db.collection<Review>("reviews").find({ productId }).toArray();
    return this._normalizeArray(reviews);
  }
  async createReview(review: InsertReview): Promise<Review> {
    const db = await connectMongo();
    const doc = { ...review, id: review.id || new ObjectId().toString() };
    await db.collection<Review>("reviews").insertOne(doc);
    return doc as Review;
  }

  // Carrito
  async getCartByUserId(userId: string): Promise<CartItem[]> {
    const db = await connectMongo();
    const cartItems = await db.collection<CartItem>("cart_items").find({ userId }).toArray();

    const enrichedCartItems = await Promise.all(
      cartItems.map(async (item) => {
        const variant = await this.getVariantById(item.variantId);
        const product = variant ? await this.getProductById(variant.productId) : null;
        const sku = variant?.sku || item.variantId;
        const productName = product?.title || `Producto ${item.variantId.substring(0, 8)}`;

        return {
          ...item,
          productName: productName,
          sku: sku,
          productPrice: variant ? variant.priceCents : 0,
          productCurrency: variant?.currency || "USD",
          productImage: product?.images?.[0] || "placeholder.jpg",
        };
      })
    );
    return enrichedCartItems;
  }
  async addToCart(userId: string, variantId: string, quantity: number): Promise<void> {
    const db = await connectMongo();
    await db.collection<CartItem>("cart_items").updateOne(
      { userId, variantId },
      { $inc: { quantity } },
      { upsert: true }
    );
  }
  async updateCartItem(userId: string, variantId: string, quantity: number): Promise<void> {
    const db = await connectMongo();
    await db.collection<CartItem>("cart_items").updateOne(
      { userId, variantId },
      { $set: { quantity } }
    );
  }
  async removeFromCart(userId: string, variantId: string): Promise<void> {
    const db = await connectMongo();
    await db.collection<CartItem>("cart_items").deleteOne({ userId, variantId });
  }
  async clearCart(userId: string): Promise<void> {
    const db = await connectMongo();
    await db.collection<CartItem>("cart_items").deleteMany({ userId });
  }
}

export const storage = new DatabaseStorage();