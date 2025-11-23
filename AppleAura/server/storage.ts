// Storage implementation for AppleAura
import { MongoClient, Db, Collection, ObjectId } from "mongodb";
// SQL (SQLite) for users
import { dbSql } from "./sql";
import { users } from "shared/schema-sqlite";
import { eq } from "drizzle-orm";

// Shared schema types
import {
  User,
  InsertUser,
  SellerProfile,
  InsertSellerProfile,
  Category,
  Product,
  InsertProduct,
  ProductVariant,
  InsertProductVariant,
  Order,
  InsertOrder,
  OrderItem,
  Review,
  InsertReview,
  CartItem,
} from "../shared/schema";

import { connectMongo } from "./mongo-connection";

type MongoDoc = { id?: string; _id?: ObjectId };

export interface IStorage {
  // SQL area
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Mongo area
  getSellerProfile(userId: string): Promise<SellerProfile | undefined>;
  createSellerProfile(profile: InsertSellerProfile): Promise<SellerProfile>;
  updateSellerProfile(userId: string, updates: Partial<SellerProfile>): Promise<SellerProfile | undefined>;
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: { name: string; description?: string; icon?: string; parentId?: string }): Promise<Category>;
  getProducts(filters?: any): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct, variantData: { priceCents: number; sku: string; stock: number; discountPercentage?: number }): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>, variantUpdates?: Partial<ProductVariant>): Promise<Product | undefined>;
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

  // Images
  uploadImage(buffer: Buffer, mimeType: string): Promise<string>;
  getImage(id: string): Promise<{ buffer: Buffer; mimeType: string } | undefined>;
  deleteImage(url: string): Promise<void>;

  // Admin
  getAdminStats(): Promise<any>;
  getRevenueChartData(): Promise<any[]>;
  getCategoryChartData(): Promise<any[]>;
  getPendingSellers(): Promise<SellerProfile[]>;
  updateSellerStatus(id: string, status: "verified" | "rejected"): Promise<SellerProfile | undefined>;
  getAllOrders(): Promise<Order[]>;
  getAllUsers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // ---------- Helpers ----------
  private _normalize<T extends MongoDoc>(doc: T | null | undefined): T | undefined {
    if (doc && !doc.id && doc._id) {
      doc.id = doc._id.toString();
    }
    return doc ?? undefined;
  }

  private _normalizeArray<T extends MongoDoc>(docs: T[]): T[] {
    return docs.map((d) => this._normalize(d)).filter(Boolean) as T[];
  }

  private async _findById<T extends MongoDoc>(collection: Collection<T>, id: string): Promise<T | undefined> {
    if (!id) return undefined;
    let doc = await collection.findOne({ id } as any);
    if (!doc && ObjectId.isValid(id)) {
      doc = await collection.findOne({ _id: new ObjectId(id) } as any);
    }
    return this._normalize(doc as T | null);
  }

  // ---------- SQL (SQLite) ----------
  async getUser(id: string): Promise<User | undefined> {
    try {
      const idNum = parseInt(id);
      if (isNaN(idNum)) return undefined;
      const result = dbSql.select().from(users).where(eq(users.id, idNum)).all();
      if (!result.length) return undefined;
      const u = result[0];
      return {
        id: u.id.toString(),
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role as any,
        name: u.name || "Usuario",
        createdAt: u.createdAt ? u.createdAt.getTime() : Date.now(),
      };
    } catch (e) {
      console.error("Error SQLite getUser:", e);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = dbSql.select().from(users).where(eq(users.email, email)).all();
      if (!result.length) return undefined;
      const u = result[0];
      return {
        id: u.id.toString(),
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role as any,
        name: u.name || "Usuario",
        createdAt: u.createdAt ? u.createdAt.getTime() : Date.now(),
      };
    } catch (e) {
      console.error("Error SQLite getUserByEmail:", e);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = dbSql
      .insert(users)
      .values({
        email: insertUser.email,
        passwordHash: insertUser.passwordHash,
        role: insertUser.role || "buyer",
        name: insertUser.name || insertUser.email.split("@")[0],
        createdAt: new Date(),
      } as any)
      .returning()
      .get();
    return {
      id: result.id.toString(),
      email: result.email,
      passwordHash: result.passwordHash,
      role: result.role as any,
      name: result.name || "Usuario",
      createdAt: result.createdAt ? result.createdAt.getTime() : Date.now(),
    };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const idNum = parseInt(id);
    if (isNaN(idNum)) return undefined;
    const sqlUpdates: any = {};
    if (updates.role) sqlUpdates.role = updates.role;
    if (updates.name) sqlUpdates.name = updates.name;
    if (updates.passwordHash) sqlUpdates.passwordHash = updates.passwordHash;
    if (!Object.keys(sqlUpdates).length) return this.getUser(id);
    const result = dbSql.update(users).set(sqlUpdates).where(eq(users.id, idNum)).returning().get();
    if (!result) return undefined;
    return {
      id: result.id.toString(),
      email: result.email,
      passwordHash: result.passwordHash,
      role: result.role as any,
      name: result.name || "",
      createdAt: result.createdAt ? result.createdAt.getTime() : Date.now(),
    };
  }

  // ---------- MongoDB ----------
  async getSellerProfile(userId: string): Promise<SellerProfile | undefined> {
    const db = await connectMongo();
    const profile = await db.collection<SellerProfile>("seller_profiles").findOne({ userId });
    return this._normalize(profile);
  }

  async createSellerProfile(profile: InsertSellerProfile): Promise<SellerProfile> {
    const db = await connectMongo();
    const newId = new ObjectId();
    const doc = { ...profile, _id: newId, id: profile.id || newId.toString() };
    await db.collection<SellerProfile>("seller_profiles").insertOne(doc);
    return doc as SellerProfile;
  }

  async updateSellerProfile(userId: string, updates: Partial<SellerProfile>): Promise<SellerProfile | undefined> {
    const db = await connectMongo();
    await db.collection<SellerProfile>("seller_profiles").updateOne({ userId }, { $set: updates });
    return this.getSellerProfile(userId);
  }

  async getCategories(): Promise<Category[]> {
    const db = await connectMongo();
    const categories = await db.collection<Category>("categories").find().toArray();
    return this._normalizeArray(categories);
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const db = await connectMongo();
    return this._findById<Category>(db.collection<Category>("categories"), id);
  }

  async createCategory(category: { name: string; description?: string; icon?: string; parentId?: string }): Promise<Category> {
    const db = await connectMongo();
    const newId = new ObjectId();
    const doc = { ...category, _id: newId, id: newId.toString() };
    await db.collection<Category>("categories").insertOne(doc);
    return doc as Category;
  }

  // ---------- Product Pipeline ----------
  private _productBasePipeline(filters?: any): any[] {
    const pipeline: any[] = [];
    const { limit, offset, sort, ...queryFilters } = filters || {};
    const preMatch: any = {};
    const postMatch: any = {};

    if (queryFilters) {
      if (queryFilters.search) {
        const regex = new RegExp(String(queryFilters.search), "i");
        preMatch.$or = [{ name: regex }, { description: regex }];
      }
      if (queryFilters.categoryId) preMatch.categoryId = queryFilters.categoryId;
      if (queryFilters.brand && queryFilters.brand !== "Todas") preMatch.brand = queryFilters.brand;
      if (queryFilters.freeShipping === true || queryFilters.freeShipping === "true") preMatch.freeShipping = true;
      if (queryFilters.id) {
        if (ObjectId.isValid(queryFilters.id)) {
          const idCondition = { $or: [{ _id: new ObjectId(queryFilters.id) }, { id: queryFilters.id }] };
          if (preMatch.$or) {
            preMatch.$and = [{ $or: preMatch.$or }, idCondition];
            delete preMatch.$or;
          } else {
            preMatch.$or = idCondition.$or;
          }
        } else {
          preMatch.id = queryFilters.id;
        }
      }
      if (queryFilters.slug) preMatch.slug = queryFilters.slug;
      if (queryFilters.sellerId) preMatch.sellerId = queryFilters.sellerId;
      if (queryFilters.minPrice) postMatch.price = { ...(postMatch.price || {}), $gte: Number(queryFilters.minPrice) };
      if (queryFilters.maxPrice) postMatch.price = { ...(postMatch.price || {}), $lte: Number(queryFilters.maxPrice) };
      if (queryFilters.hasDiscount === true) postMatch.discountPercentage = { $gt: 0 };
    }

    if (Object.keys(preMatch).length > 0) pipeline.push({ $match: preMatch });

    // Lookup variants
    pipeline.push({
      $lookup: {
        from: "product_variants",
        localField: "id",
        foreignField: "productId",
        as: "variants",
      },
    });
    // First variant
    pipeline.push({ $addFields: { firstVariant: { $arrayElemAt: ["$variants", 0] } } });
    // Add fields
    pipeline.push({
      $addFields: {
        variantId: "$firstVariant.id",
        price: { $ifNull: ["$firstVariant.priceCents", 0] },
        priceCents: { $ifNull: ["$firstVariant.priceCents", 0] },
        stock: "$firstVariant.stock",
        sku: "$firstVariant.sku",
        discountPercentage: "$firstVariant.discountPercentage",
        freeShipping: "$firstVariant.isFreeShipping",
        isFreeShipping: "$firstVariant.isFreeShipping",
        shippingCost: { $divide: [{ $ifNull: ["$firstVariant.shippingCostCents", 0] }, 100] },
      },
    });

    if (Object.keys(postMatch).length > 0) pipeline.push({ $match: postMatch });

    // Seller profile lookup
    pipeline.push({
      $lookup: {
        from: "seller_profiles",
        localField: "sellerId",
        foreignField: "id",
        as: "sellerProfile",
      },
    });
    pipeline.push({ $unwind: { path: "$sellerProfile", preserveNullAndEmptyArrays: true } });
    // Reviews lookup
    pipeline.push({
      $lookup: {
        from: "reviews",
        localField: "id",
        foreignField: "productId",
        as: "reviews",
      },
    });
    pipeline.push({
      $addFields: {
        reviewCount: { $size: "$reviews" },
        rating: {
          $cond: [
            { $gt: [{ $size: "$reviews" }, 0] },
            { $avg: { $map: { input: "$reviews", as: "r", in: { $toDouble: "$$r.rating" } } } },
            0,
          ],
        },
      },
    });

    if (sort) {
      if (sort === "newest") pipeline.push({ $sort: { createdAt: -1 } });
      else if (sort === "price_asc") pipeline.push({ $sort: { price: 1 } });
      else if (sort === "price_desc") pipeline.push({ $sort: { price: -1 } });
      else if (sort === "rating") pipeline.push({ $sort: { rating: -1 } });
      else if (sort === "popular") pipeline.push({ $sort: { reviewCount: -1 } });
    }

    if (offset !== undefined) pipeline.push({ $skip: Number(offset) });
    if (limit !== undefined) pipeline.push({ $limit: Number(limit) });

    pipeline.push({ $project: { reviews: 0 } });
    return pipeline;
  }

  async getProducts(filters?: any): Promise<Product[]> {
    const db = await connectMongo();
    const pipeline = this._productBasePipeline(filters);
    const raw = await db.collection<any>("products").aggregate(pipeline).toArray();
    const enriched = await Promise.all(
      raw.map(async (prod) => {
        let sellerName = "Vendedor";
        const sellerData = prod.sellerProfile || {};
        if (sellerData.userId) {
          const user = await this.getUser(sellerData.userId);
          if (sellerData.displayName) sellerName = sellerData.displayName;
          else if (user && user.name) sellerName = user.name;
        }
        const finalSeller = { ...sellerData, displayName: sellerName, name: sellerName };
        return {
          ...prod,
          seller: finalSeller,
          sellerName,
          rating: Number(prod.rating || 0),
          id: prod._id ? prod._id.toString() : prod.id,
        };
      })
    );
    return this._normalizeArray(enriched as unknown as Product[]);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const products = await this.getProducts({ id, limit: 1 });
    return products.length ? products[0] : undefined;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const products = await this.getProducts({ slug, limit: 1 });
    return products.length ? products[0] : undefined;
  }

  async createProduct(product: InsertProduct, variantData: { priceCents: number; sku: string; stock: number; discountPercentage?: number }): Promise<Product> {
    const db = await connectMongo();
    const newProductId = new ObjectId();
    const productDoc = { ...product, _id: newProductId, id: newProductId.toString() };
    await db.collection<Product>("products").insertOne(productDoc);
    const newVariantId = new ObjectId();
    const variantDoc = {
      ...variantData,
      productId: productDoc.id,
      _id: newVariantId,
      id: newVariantId.toString(),
      currency: "CLP",
    };
    await db.collection<ProductVariant>("product_variants").insertOne(variantDoc);
    return (await this.getProductById(productDoc.id)) as Product;
  }

  async updateProduct(id: string, updates: Partial<Product>, variantUpdates?: Partial<ProductVariant>): Promise<Product | undefined> {
    const db = await connectMongo();
    if (Object.keys(updates).length) {
      await db.collection<Product>("products").updateOne({ id }, { $set: updates });
    }

    if (variantUpdates && Object.keys(variantUpdates).length) {
      const variants = await db.collection<ProductVariant>("product_variants").find({ productId: id }).toArray();

      if (variants.length === 0) {
        const newVariantId = new ObjectId();
        const variantDoc = {
          productId: id,
          _id: newVariantId,
          id: newVariantId.toString(),
          currency: "CLP",
          priceCents: variantUpdates.priceCents || 0,
          sku: variantUpdates.sku || "DEFAULT-SKU",
          stock: variantUpdates.stock || 0,
          discountPercentage: variantUpdates.discountPercentage || 0,
          shippingCostCents: variantUpdates.shippingCostCents || 0,
          isFreeShipping: variantUpdates.isFreeShipping || false,
          attributes: {}
        };
        await db.collection<ProductVariant>("product_variants").insertOne(variantDoc as any);
      } else {
        await db.collection<ProductVariant>("product_variants").updateMany({ productId: id }, { $set: variantUpdates });
      }
    }
    return this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<void> {
    const db = await connectMongo();
    const product = await this.getProductById(id);
    if (product && product.images && product.images.length > 0) {
      await Promise.all(product.images.map((url) => this.deleteImage(url)));
    }

    const filter: any = { id };
    if (ObjectId.isValid(id)) {
      filter.$or = [{ id }, { _id: new ObjectId(id) }];
      delete filter.id;
    }

    await db.collection<Product>("products").deleteOne(filter);
    await db.collection<ProductVariant>("product_variants").deleteMany({ productId: id });
    await db.collection<Review>("reviews").deleteMany({ productId: id });
  }

  async getVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    const db = await connectMongo();
    const variants = await db.collection<ProductVariant>("product_variants").find({ productId }).toArray();
    return this._normalizeArray(variants);
  }

  async getVariantById(id: string): Promise<ProductVariant | undefined> {
    const db = await connectMongo();
    return this._findById<ProductVariant>(db.collection<ProductVariant>("product_variants"), id);
  }

  async createVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const db = await connectMongo();
    const newId = new ObjectId();
    const doc = { ...variant, _id: newId, id: variant.id || newId.toString() };
    await db.collection<ProductVariant>("product_variants").insertOne(doc);
    return doc as ProductVariant;
  }

  // ---------- Cart ----------
  async getCartByUserId(userId: string): Promise<CartItem[]> {
    const db = await connectMongo();
    const items = await db.collection<CartItem>("cart_items").find({ userId }).toArray();
    const normalized = this._normalizeArray(items);
    const enriched = await Promise.all(
      normalized.map(async (item) => {
        const variant = await this.getVariantById(item.variantId);
        const product = variant ? await this.getProductById(variant.productId) : null;
        const sku = variant?.sku || item.variantId;
        const productName = product?.title || `Producto ${item.variantId.substring(0, 8)}`;
        return { ...item, productName, sku, productPrice: variant ? variant.priceCents : 0, productCurrency: variant?.currency || "USD", productImage: product?.images?.[0] || "placeholder.jpg" };
      })
    );
    return enriched;
  }

  async addToCart(userId: string, variantId: string, quantity: number): Promise<void> {
    const db = await connectMongo();
    await db.collection<CartItem>("cart_items").updateOne({ userId, variantId }, { $inc: { quantity } }, { upsert: true });
  }

  async updateCartItem(userId: string, variantId: string, quantity: number): Promise<void> {
    const db = await connectMongo();
    await db.collection<CartItem>("cart_items").updateOne({ userId, variantId }, { $set: { quantity } });
  }

  async removeFromCart(userId: string, variantId: string): Promise<void> {
    const db = await connectMongo();
    await db.collection<CartItem>("cart_items").deleteOne({ userId, variantId });
  }

  async clearCart(userId: string): Promise<void> {
    const db = await connectMongo();
    await db.collection<CartItem>("cart_items").deleteMany({ userId });
  }

  // ---------- Orders ----------
  async getOrdersBySellerId(sellerId: string): Promise<Order[]> {
    const db = await connectMongo();
    const orders = await db.collection<Order>("orders").find({ sellerId }).toArray();
    return this._normalizeArray(orders);
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    const db = await connectMongo();
    const orders = await db.collection<Order>("orders").find({ userId }).toArray();
    return this._normalizeArray(orders);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const db = await connectMongo();
    const newId = new ObjectId();
    const doc = { ...order, _id: newId, id: order.id || newId.toString() };
    await db.collection<Order>("orders").insertOne(doc);
    return doc as Order;
  }

  // ---------- Reviews ----------
  async getReviewsByProductId(productId: string): Promise<Review[]> {
    const db = await connectMongo();
    const reviews = await db.collection<Review>("reviews").find({ productId }).toArray();
    const enriched = await Promise.all(
      reviews.map(async (review) => {
        const user = await this.getUser(review.userId);
        return { ...review, userName: user?.name || "Usuario" } as Review;
      })
    );
    return this._normalizeArray(enriched);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const db = await connectMongo();
    const newId = new ObjectId();
    const doc = { ...review, _id: newId, id: review.id || newId.toString() };
    await db.collection<Review>("reviews").insertOne(doc);
    return doc as Review;
  }

  async getSellerStats(sellerId: string): Promise<any> {
    const db = await connectMongo();
    const productCount = await db.collection<Product>("products").countDocuments({ sellerId });
    const orderCount = await db.collection<Order>("orders").countDocuments({ sellerId });
    return { productCount, orderCount, totalProducts: productCount, totalOrders: orderCount, totalRevenue: 0, pendingOrders: 0 };
  }

  // ---------- Images ----------
  async uploadImage(buffer: Buffer, mimeType: string): Promise<string> {
    const db = await connectMongo();
    const id = new ObjectId();
    await db.collection("images").insertOne({ _id: id, id: id.toString(), buffer, mimeType, createdAt: new Date() });
    return id.toString();
  }

  async getImage(id: string): Promise<{ buffer: Buffer; mimeType: string } | undefined> {
    const db = await connectMongo();
    const image = await db.collection<any>("images").findOne({ id });
    if (!image) return undefined;
    return { buffer: image.buffer.buffer, mimeType: image.mimeType };
  }

  async deleteImage(url: string): Promise<void> {
    if (!url.includes("amazonaws.com")) return;
    try {
      const urlObj = new URL(url);
      const key = urlObj.pathname.substring(1);
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME && process.env.AWS_REGION) {
        const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
        const s3 = new S3Client({
          region: process.env.AWS_REGION,
          credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
        });
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
        console.log(`[S3 Delete] Successfully deleted ${key}`);
      }
    } catch (e) {
      console.error(`Failed to delete S3 image ${url}:`, e);
    }
  }

  // ---------- Admin ----------
  async getAdminStats(): Promise<any> {
    const totalUsers = dbSql.select().from(users).all().length;
    const db = await connectMongo();
    const totalOrders = await db.collection<Order>("orders").countDocuments();
    const revenueRes = await db.collection<Order>("orders").aggregate([
      { $match: { status: { $in: ["delivered", "shipped", "paid"] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalCents" } } },
    ]).toArray();
    const totalRevenue = revenueRes[0]?.totalRevenue || 0;
    const totalProducts = await db.collection<Product>("products").countDocuments();
    return { totalUsers, totalOrders, totalRevenue, totalProducts };
  }

  async getRevenueChartData(): Promise<any[]> {
    const db = await connectMongo();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const pipeline = [
      { $match: { status: { $in: ["delivered", "shipped", "paid"] }, createdAt: { $gte: sixMonthsAgo.getTime() } } },
      { $project: { date: { $toDate: "$createdAt" }, totalCents: 1 } },
      { $group: { _id: { month: { $month: "$date" }, year: { $year: "$date" } }, total: { $sum: "$totalCents" } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ];
    return await db.collection<Order>("orders").aggregate(pipeline).toArray();
  }

  async getCategoryChartData(): Promise<any[]> {
    return [];
  }

  async getPendingSellers(): Promise<SellerProfile[]> {
    const db = await connectMongo();
    const sellers = await db.collection<SellerProfile>("seller_profiles").find({ status: "pending" }).toArray();
    return this._normalizeArray(sellers);
  }

  async updateSellerStatus(id: string, status: "verified" | "rejected"): Promise<SellerProfile | undefined> {
    const db = await connectMongo();
    const collection = db.collection<SellerProfile>("seller_profiles");
    let filter: any = { id };
    if (ObjectId.isValid(id)) filter = { $or: [{ id }, { _id: new ObjectId(id) }] };
    await collection.updateOne(filter, { $set: { status } });
    const updated = await collection.findOne(filter);
    return this._normalize(updated);
  }

  async getAllOrders(): Promise<Order[]> {
    const db = await connectMongo();
    const orders = await db.collection<Order>("orders").find({ sellerId }).toArray();
    return this._normalizeArray(orders);
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = dbSql.select().from(users).all();
      return result.map((u) => ({ id: u.id.toString(), email: u.email, passwordHash: u.passwordHash, role: u.role as any, name: u.name || "Usuario", createdAt: u.createdAt ? u.createdAt.getTime() : Date.now() }));
    } catch (e) {
      console.error("Error SQLite getAllUsers:", e);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();