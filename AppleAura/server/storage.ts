import { MongoClient, Db, Collection, ObjectId } from "mongodb";
// SQL (SQLite) imports
import { dbSql } from "./sql";
import { users } from "shared/schema-sqlite";
import { eq } from "drizzle-orm";

// Shared schema types
import {
  User, InsertUser, SellerProfile, InsertSellerProfile, Category,
  Product, InsertProduct, ProductVariant, InsertProductVariant,
  Order, InsertOrder, OrderItem, Review, InsertReview, CartItem,
} from "../shared/schema";

import { connectMongo } from "./mongo-connection";

type MongoDoc = { id?: string; _id?: ObjectId };

export interface IStorage {
  // SQL
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Mongo - Core
  getSellerProfile(userId: string): Promise<SellerProfile | undefined>;
  createSellerProfile(profile: InsertSellerProfile): Promise<SellerProfile>;
  updateSellerProfile(userId: string, updates: Partial<SellerProfile>): Promise<SellerProfile | undefined>;

  // Products
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: any): Promise<Category>;

  getProducts(filters?: any): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct, variantData: any): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>, variantUpdates?: Partial<ProductVariant>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;

  // Variants
  getVariantsByProductId(productId: string): Promise<ProductVariant[]>;
  getVariantById(id: string): Promise<ProductVariant | undefined>;
  createVariant(variant: InsertProductVariant): Promise<ProductVariant>;

  // Cart & Orders
  getCartByUserId(userId: string): Promise<CartItem[]>;
  addToCart(userId: string, variantId: string, quantity: number): Promise<void>;
  updateCartItem(userId: string, variantId: string, quantity: number): Promise<void>;
  removeFromCart(userId: string, variantId: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  getOrdersBySellerId(sellerId: string): Promise<Order[]>;
  getOrdersByUserId(userId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  getAllOrders(): Promise<Order[]>;

  // Interactions
  getReviewsByProductId(productId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  getSellerStats(sellerId: string): Promise<any>;

  // Assets
  uploadImage(buffer: Buffer, mimeType: string): Promise<string>;
  getImage(id: string): Promise<{ buffer: Buffer; mimeType: string } | undefined>;
  deleteImage(url: string): Promise<void>;

  // Admin
  getAdminStats(): Promise<any>;
  getRevenueChartData(): Promise<any[]>;
  getCategoryChartData(): Promise<any[]>;
  getPendingSellers(): Promise<SellerProfile[]>;
  updateSellerStatus(id: string, status: "verified" | "rejected"): Promise<SellerProfile | undefined>;
}

export class DatabaseStorage implements IStorage {

  // --- Helpers ---
  private _normalize<T extends MongoDoc>(doc: any): T | undefined {
    if (!doc) return undefined;
    if (!doc.id && doc._id) doc.id = doc._id.toString();
    return doc as T;
  }

  private _normalizeArray<T extends MongoDoc>(docs: any[]): T[] {
    return docs.map(d => this._normalize<T>(d)).filter(Boolean) as T[];
  }

  private async _getCollection<T extends MongoDoc>(name: string): Promise<Collection<T>> {
    const db = await connectMongo();
    return db.collection<T>(name);
  }

  private async _findById<T extends MongoDoc>(collectionName: string, id: string): Promise<T | undefined> {
    if (!id) return undefined;
    const col = await this._getCollection<T>(collectionName);
    const filter = ObjectId.isValid(id) ? { $or: [{ id }, { _id: new ObjectId(id) }] } : { id };
    const doc = await col.findOne(filter as any);
    return this._normalize(doc);
  }

  // --- SQL Implementations (Users) ---
  async getUser(id: string): Promise<User | undefined> {
    try {
      const idNum = parseInt(id);
      if (isNaN(idNum)) return undefined;
      const [user] = dbSql.select().from(users).where(eq(users.id, idNum)).all();
      return user ? { ...user, id: user.id.toString(), role: user.role as any, createdAt: user.createdAt?.getTime() || Date.now() } : undefined;
    } catch (e) {
      console.error("SQLite Error getUser:", e);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = dbSql.select().from(users).where(eq(users.email, email)).all();
    return user ? { ...user, id: user.id.toString(), role: user.role as any, createdAt: user.createdAt?.getTime() || Date.now() } : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = dbSql.insert(users).values({
      ...insertUser,
      role: insertUser.role || "buyer",
      name: insertUser.name || insertUser.email.split("@")[0],
      createdAt: new Date(),
    } as any).returning().get();
    return { ...result, id: result.id.toString(), role: result.role as any, createdAt: result.createdAt?.getTime() || Date.now() };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const idNum = parseInt(id);
    if (isNaN(idNum)) return undefined;
    const result = dbSql.update(users).set(updates).where(eq(users.id, idNum)).returning().get();
    return result ? { ...result, id: result.id.toString(), role: result.role as any, createdAt: result.createdAt?.getTime() || Date.now() } : undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return dbSql.select().from(users).all().map(u => ({ ...u, id: u.id.toString(), role: u.role as any, createdAt: u.createdAt?.getTime() || Date.now() }));
  }

  // --- MongoDB Implementations ---

  async getSellerProfile(userId: string): Promise<SellerProfile | undefined> {
    const col = await this._getCollection<SellerProfile>("seller_profiles");
    const profile = await col.findOne({ userId });
    return this._normalize(profile);
  }

  async createSellerProfile(profile: InsertSellerProfile): Promise<SellerProfile> {
    const col = await this._getCollection<SellerProfile>("seller_profiles");
    const newId = new ObjectId();
    const doc = { ...profile, _id: newId, id: profile.id || newId.toString() };
    await col.insertOne(doc as any);
    return this._normalize(doc)!;
  }

  async updateSellerProfile(userId: string, updates: Partial<SellerProfile>): Promise<SellerProfile | undefined> {
    const col = await this._getCollection<SellerProfile>("seller_profiles");
    await col.updateOne({ userId }, { $set: updates });
    return this.getSellerProfile(userId);
  }

  // --- Products & Categories ---

  async getCategories(): Promise<Category[]> {
    const col = await this._getCollection<Category>("categories");
    return this._normalizeArray(await col.find().toArray());
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return this._findById("categories", id);
  }

  async createCategory(category: any): Promise<Category> {
    const col = await this._getCollection<Category>("categories");
    const newId = new ObjectId();
    const doc = { ...category, _id: newId, id: newId.toString() };
    await col.insertOne(doc);
    return doc;
  }

  // =================================================================
  // GET PRODUCTS: Con corrección para "Variante Virtual" (Legacy Fix)
  // =================================================================
  async getProducts(filters: any = {}): Promise<Product[]> {
    const col = await this._getCollection("products");
    const pipeline: any[] = [];

    // 1. Match Stage
    const match: any = {};
    if (filters.search) match.$or = [{ title: new RegExp(filters.search, "i") }, { description: new RegExp(filters.search, "i") }];
    if (filters.categoryId) match.categoryId = filters.categoryId;
    if (filters.brand && filters.brand !== "Todas") match.brand = filters.brand;
    if (filters.sellerId) match.sellerId = filters.sellerId;
    if (filters.id) {
      match.$or = [
        { id: filters.id },
        { _id: ObjectId.isValid(filters.id) ? new ObjectId(filters.id) : null }
      ];
    }
    if (filters.slug) match.slug = filters.slug;

    if (Object.keys(match).length) pipeline.push({ $match: match });

    // 2. Lookups
    pipeline.push(
      { $lookup: { from: "product_variants", localField: "id", foreignField: "productId", as: "variants" } },
      { $addFields: { firstVariant: { $arrayElemAt: ["$variants", 0] } } },

      { $lookup: { from: "seller_profiles", localField: "sellerId", foreignField: "id", as: "sellerProfile" } },
      { $unwind: { path: "$sellerProfile", preserveNullAndEmptyArrays: true } }
    );

    // 3. Lookup Reseñas (Opción Nuclear)
    pipeline.push({
      $lookup: {
        from: "reviews",
        let: { pidObj: "$_id", pidStr: { $toString: "$_id" } },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ["$productId", "$$pidObj"] },
                  { $eq: ["$productId", "$$pidStr"] },
                  { $eq: [{ $toString: "$productId" }, "$$pidStr"] }
                ]
              }
            }
          }
        ],
        as: "reviews"
      }
    });

    // Rating
    pipeline.push({
      $addFields: {
        reviewCount: { $size: "$reviews" },
        rating: { $cond: [{ $gt: [{ $size: "$reviews" }, 0] }, { $avg: { $map: { input: "$reviews", as: "r", in: { $toDouble: "$$r.rating" } } } }, 0] }
      }
    });

    const rawProducts = await col.aggregate(pipeline).toArray();

    // 5. Normalización y VARIANTE VIRTUAL
    return await Promise.all(rawProducts.map(async (p) => {
      let sellerName = p.sellerProfile?.displayName;
      if (!sellerName && p.sellerProfile?.userId) {
        const user = await this.getUser(p.sellerProfile.userId);
        sellerName = user?.name || "Vendedor";
      }

      const enrichedSeller = {
        ...p.sellerProfile,
        name: sellerName || "Vendedor",
        displayName: sellerName || "Vendedor",
        location: p.sellerProfile?.location || ""
      };

      // --- LOGICA DE FALLBACK PARA PRODUCTOS ANTIGUOS ---
      let finalVariants = this._normalizeArray(p.variants || []);

      // Si el producto no tiene variantes reales, creamos una virtual
      if (finalVariants.length === 0) {
        const legacyPrice = p.priceCents || (p.price ? p.price * 100 : 0) || 0;
        const legacyStock = p.stock || 0;

        finalVariants = [{
          id: p._id ? p._id.toString() : p.id, // El ID de la variante es el mismo del producto
          productId: p.id,
          sku: p.sku || "LEGACY",
          priceCents: legacyPrice,
          stock: legacyStock,
          discountPercentage: p.discountPercentage || 0,
          isFreeShipping: !!p.isFreeShipping,
          currency: "CLP",
          attributes: {}
        } as any];
      }

      // Usamos el precio de la primera variante (real o virtual) para filtrar
      const mainVariant = finalVariants[0];
      const displayPrice = mainVariant?.priceCents || 0;

      // Filtros manuales de precio
      if (filters.minPrice && displayPrice < filters.minPrice) return null;
      if (filters.maxPrice && displayPrice > filters.maxPrice) return null;

      return this._normalize({
        ...p,
        seller: enrichedSeller,
        sellerName: sellerName,
        reviews: this._normalizeArray(p.reviews || []),
        variants: finalVariants, // Enviamos las variantes normalizadas

        // Propiedades raíz para compatibilidad con tarjetas
        price: displayPrice,
        priceCents: displayPrice,
        stock: mainVariant?.stock || 0,

        id: p._id ? p._id.toString() : p.id
      })!;
    })).then(results => results.filter(Boolean) as Product[]);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const products = await this.getProducts({ id, limit: 1 });
    return products[0];
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const products = await this.getProducts({ slug, limit: 1 });
    return products[0];
  }

  async createProduct(product: InsertProduct, variantData: any): Promise<Product> {
    const col = await this._getCollection<Product>("products");
    const newId = new ObjectId();
    const productDoc = { ...product, _id: newId, id: newId.toString(), brand: product.brand || "Generico", createdAt: new Date() };
    await col.insertOne(productDoc as any);

    await this.createVariant({ ...variantData, productId: productDoc.id });
    return this.getProductById(productDoc.id) as Promise<Product>;
  }

  async updateProduct(id: string, updates: Partial<Product>, variantUpdates?: Partial<ProductVariant>): Promise<Product | undefined> {
    const col = await this._getCollection<Product>("products");
    const filter = ObjectId.isValid(id) ? { $or: [{ id }, { _id: new ObjectId(id) }] } : { id };

    if (Object.keys(updates).length) await col.updateOne(filter, { $set: updates });

    if (variantUpdates && Object.keys(variantUpdates).length) {
      const variantsCol = await this._getCollection<ProductVariant>("product_variants");
      // Si existen variantes, las actualizamos. Si no, deberíamos crear una? 
      // Por simplicidad, asumimos que si editas, ya se migró a variante virtual al leer.
      await variantsCol.updateMany({ productId: id }, { $set: variantUpdates });
    }
    return this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<void> {
    const col = await this._getCollection<Product>("products");
    const filter = ObjectId.isValid(id) ? { $or: [{ id }, { _id: new ObjectId(id) }] } : { id };

    const product = await this.getProductById(id);
    if (product?.images?.length) await Promise.all(product.images.map(url => this.deleteImage(url)));

    await col.deleteOne(filter);
    const variantsCol = await this._getCollection("product_variants");
    await variantsCol.deleteMany({ productId: id });
    const reviewsCol = await this._getCollection("reviews");
    await reviewsCol.deleteMany({ productId: id });
  }

  // =================================================================
  // GET VARIANTS: Con corrección para "Variante Virtual" (Legacy Fix)
  // =================================================================
  async getVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    const col = await this._getCollection<ProductVariant>("product_variants");
    const variants = await col.find({ productId }).toArray();
    const normalizedVariants = this._normalizeArray(variants);

    // SI HAY VARIANTE REAL, RETURN
    if (normalizedVariants.length > 0) return normalizedVariants;

    // SI NO, GENERAR VIRTUAL
    const product = await this.getProductById(productId);
    if (product) {
      return [{
        id: product.id,
        productId: product.id,
        sku: product.sku || "LEGACY",
        priceCents: product.priceCents || 0,
        stock: product.stock || 0,
        discountPercentage: product.discountPercentage || 0,
        shippingCostCents: 0,
        isFreeShipping: !!product.isFreeShipping,
        currency: "CLP",
        attributes: {}
      } as any];
    }
    return [];
  }

  async getVariantById(id: string): Promise<ProductVariant | undefined> {
    return this._findById("product_variants", id);
  }

  async createVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const col = await this._getCollection<ProductVariant>("product_variants");
    const newId = new ObjectId();
    const doc = { ...variant, _id: newId, id: variant.id || newId.toString(), currency: "CLP" };
    await col.insertOne(doc as any);
    return this._normalize(doc)!;
  }

  // --- Cart ---
  async getCartByUserId(userId: string): Promise<CartItem[]> {
    const col = await this._getCollection<CartItem>("cart_items");
    const items = await col.find({ userId }).toArray();

    return await Promise.all(items.map(async (item) => {
      const variant = await this.getVariantById(item.variantId);
      // Fallback: Si la variante no existe en DB, intentamos buscarla en la virtual del producto
      // Esto es complejo aquí, pero asumimos que si se añadió al carrito, el ID es válido.
      // Si falla, es porque se borró el producto.

      const product = variant ? await this.getProductById(variant.productId) : null;

      // Si el producto existe pero la variante no (caso legacy raro), reintentamos buscar producto por el ID de variante
      let finalProduct = product;
      let finalVariant = variant;

      if (!product && !variant) {
        // Quizás el item.variantId es en realidad un productId (caso legacy virtual)
        const p = await this.getProductById(item.variantId);
        if (p) {
          finalProduct = p;
          finalVariant = { priceCents: p.priceCents, sku: p.sku } as any;
        }
      }

      return this._normalize({
        ...item,
        productName: finalProduct?.title || "Producto no disponible",
        sku: finalVariant?.sku || "---",
        productPrice: finalVariant?.priceCents || 0,
        productImage: finalProduct?.images?.[0] || ""
      })!;
    }));
  }

  async addToCart(userId: string, variantId: string, quantity: number): Promise<void> {
    const col = await this._getCollection("cart_items");
    await col.updateOne({ userId, variantId }, { $inc: { quantity } }, { upsert: true });
  }

  async updateCartItem(userId: string, variantId: string, quantity: number): Promise<void> {
    const col = await this._getCollection("cart_items");
    await col.updateOne({ userId, variantId }, { $set: { quantity } });
  }

  async removeFromCart(userId: string, variantId: string): Promise<void> {
    const col = await this._getCollection("cart_items");
    await col.deleteOne({ userId, variantId });
  }

  async clearCart(userId: string): Promise<void> {
    const col = await this._getCollection("cart_items");
    await col.deleteMany({ userId });
  }

  // --- Orders ---
  async getOrdersBySellerId(sellerId: string): Promise<Order[]> {
    const col = await this._getCollection<Order>("orders");
    return this._normalizeArray(await col.find({ sellerId }).toArray());
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    const col = await this._getCollection<Order>("orders");
    return this._normalizeArray(await col.find({ userId }).toArray());
  }

  async getAllOrders(): Promise<Order[]> {
    const col = await this._getCollection<Order>("orders");
    return this._normalizeArray(await col.find().toArray());
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const col = await this._getCollection<Order>("orders");
    const newId = new ObjectId();
    const doc = { ...order, _id: newId, id: order.id || newId.toString(), createdAt: new Date() };
    await col.insertOne(doc as any);
    return this._normalize(doc)!;
  }

  // --- Reviews & Stats ---
  async getReviewsByProductId(productId: string): Promise<Review[]> {
    const col = await this._getCollection<Review>("reviews");
    const filter = ObjectId.isValid(productId)
      ? { $or: [{ productId: productId }, { productId: new ObjectId(productId) }] }
      : { productId: productId };

    return this._normalizeArray(await col.find(filter as any).toArray());
  }

  async createReview(review: InsertReview): Promise<Review> {
    const col = await this._getCollection<Review>("reviews");
    const newId = new ObjectId();
    const doc = { ...review, _id: newId, id: review.id || newId.toString() };
    await col.insertOne(doc as any);
    return this._normalize(doc)!;
  }

  async getSellerStats(sellerId: string): Promise<any> {
    const db = await connectMongo();
    const productCount = await db.collection("products").countDocuments({ sellerId });
    const orderCount = await db.collection("orders").countDocuments({ sellerId });
    return { productCount, orderCount, totalProducts: productCount, totalOrders: orderCount, totalRevenue: 0 };
  }

  // --- Admin Analytics ---
  async getAdminStats(): Promise<any> {
    const db = await connectMongo();
    const totalUsers = dbSql.select().from(users).all().length;
    const totalOrders = await db.collection("orders").countDocuments();
    const totalProducts = await db.collection("products").countDocuments();

    const [rev] = await db.collection("orders").aggregate([
      { $match: { status: { $in: ["delivered", "shipped", "paid"] } } },
      { $group: { _id: null, total: { $sum: "$totalCents" } } }
    ]).toArray();

    return { totalUsers, totalOrders, totalProducts, totalRevenue: rev?.total || 0 };
  }

  async getRevenueChartData(): Promise<any[]> {
    const col = await this._getCollection("orders");
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return await col.aggregate([
      { $match: { status: { $in: ["delivered", "shipped", "paid"] }, createdAt: { $gte: sixMonthsAgo } } },
      { $project: { date: { $toDate: "$createdAt" }, totalCents: 1 } },
      { $group: { _id: { month: { $month: "$date" }, year: { $year: "$date" } }, total: { $sum: "$totalCents" } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]).toArray();
  }

  async getCategoryChartData(): Promise<any[]> {
    const col = await this._getCollection("products");
    return await col.aggregate([
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "id", as: "cat" } },
      { $project: { name: { $arrayElemAt: ["$cat.name", 0] }, count: 1 } }
    ]).toArray();
  }

  async getPendingSellers(): Promise<SellerProfile[]> {
    const col = await this._getCollection<SellerProfile>("seller_profiles");
    return this._normalizeArray(await col.find({ status: "pending" }).toArray());
  }

  async updateSellerStatus(id: string, status: "verified" | "rejected"): Promise<SellerProfile | undefined> {
    const col = await this._getCollection<SellerProfile>("seller_profiles");
    const filter = ObjectId.isValid(id) ? { $or: [{ id }, { _id: new ObjectId(id) }] } : { id };
    await col.updateOne(filter, { $set: { status } });
    return this._normalize(await col.findOne(filter));
  }

  // --- Images ---
  async uploadImage(buffer: Buffer, mimeType: string): Promise<string> {
    const col = await this._getCollection("images");
    const newId = new ObjectId();
    await col.insertOne({ _id: newId, id: newId.toString(), buffer, mimeType, createdAt: new Date() });
    return newId.toString();
  }

  async getImage(id: string): Promise<{ buffer: Buffer; mimeType: string } | undefined> {
    const col = await this._getCollection<any>("images");
    const img = await col.findOne({ id });
    return img ? { buffer: img.buffer.buffer, mimeType: img.mimeType } : undefined;
  }

  async deleteImage(url: string): Promise<void> {
    if (!url.includes("amazonaws.com")) return;
  }
}

export const storage = new DatabaseStorage();