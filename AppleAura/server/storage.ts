

import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { User, InsertUser, SellerProfile, InsertSellerProfile, Category, Product, InsertProduct, ProductVariant, InsertProductVariant, Order, InsertOrder, OrderItem, Review, InsertReview, CartItem } from "../shared/schema";
import { connectMongo } from "./mongo-connection";

export class DatabaseStorage implements IStorage {
  // USERS
  async getUser(id: string): Promise<User | undefined> {
    const db = await connectMongo();
    const user = await db.collection<User>("users").findOne({ id });
    return user ?? undefined;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await connectMongo();
    const user = await db.collection<User>("users").findOne({ email });
    return user ?? undefined;
  }
  async createUser(user: InsertUser): Promise<User> {
    const db = await connectMongo();
    const doc = { ...user, id: user.id || new ObjectId().toString() };
    await db.collection<User>("users").insertOne(doc);
    return doc as User;
  }
  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const db = await connectMongo();
    await db.collection<User>("users").updateOne({ id }, { $set: updates });
    const user = await db.collection<User>("users").findOne({ id });
    return user ?? undefined;
  }

  // SELLER PROFILES
  async getSellerProfile(userId: string): Promise<SellerProfile | undefined> {
    const db = await connectMongo();
    const profile = await db.collection<SellerProfile>("seller_profiles").findOne({ userId });
    return profile ?? undefined;
  }
  async createSellerProfile(profile: InsertSellerProfile): Promise<SellerProfile> {
    const db = await connectMongo();
    const doc = { ...profile, id: profile.id || new ObjectId().toString() };
    await db.collection<SellerProfile>("seller_profiles").insertOne(doc);
    return doc as SellerProfile;
  }
  async updateSellerProfile(id: string, updates: Partial<SellerProfile>): Promise<SellerProfile | undefined> {
    const db = await connectMongo();
    await db.collection<SellerProfile>("seller_profiles").updateOne({ id }, { $set: updates });
    const profile = await db.collection<SellerProfile>("seller_profiles").findOne({ id });
    return profile ?? undefined;
  }

  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    const db = await connectMongo();
    return db.collection<Category>("categories").find().toArray();
  }
  async getCategoryById(id: string): Promise<Category | undefined> {
    const db = await connectMongo();
    const category = await db.collection<Category>("categories").findOne({ id });
    return category ?? undefined;
  }
  async createCategory(category: { name: string; description?: string; icon?: string; parentId?: string }): Promise<Category> {
    const db = await connectMongo();
    const doc = { ...category, id: new ObjectId().toString() };
    await db.collection<Category>("categories").insertOne(doc);
    return doc as Category;
  }

  // PRODUCTS
  async getProducts(filters?: {
    categoryId?: string;
    search?: string;
    priceMin?: number;
    priceMax?: number;
    sellerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    const db = await connectMongo();
    const query: any = {};
    if (filters) {
      if (filters.categoryId) query.categoryId = filters.categoryId;
      if (filters.sellerId) query.sellerId = filters.sellerId;
      if (filters.status) query.status = filters.status;
      if (filters.search) query.title = { $regex: filters.search, $options: "i" };
      // priceMin/Max pueden requerir adaptación según modelo
    }
    let cursor = db.collection<Product>("products").find(query);
    if (filters?.limit) cursor = cursor.limit(filters.limit);
    if (filters?.offset) cursor = cursor.skip(filters.offset);
    return cursor.toArray();
  }
  async getProductById(id: string): Promise<Product | undefined> {
    const db = await connectMongo();
    const product = await db.collection<Product>("products").findOne({ id });
    return product ?? undefined;
  }
  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const db = await connectMongo();
    const product = await db.collection<Product>("products").findOne({ slug });
    return product ?? undefined;
  }
  async createProduct(product: InsertProduct): Promise<Product> {
    const db = await connectMongo();
    const doc = { ...product, id: product.id || new ObjectId().toString() };
    await db.collection<Product>("products").insertOne(doc);
    return doc as Product;
  }
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const db = await connectMongo();
    await db.collection<Product>("products").updateOne({ id }, { $set: updates });
    const product = await db.collection<Product>("products").findOne({ id });
    return product ?? undefined;
  }

  // Elimina un producto y sus variantes
  async deleteProduct(id: string): Promise<void> {
    const db = await connectMongo();
    await db.collection("product_variants").deleteMany({ productId: id });
    await db.collection("products").deleteOne({ id });
  }

  // PRODUCT VARIANTS
  async getVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    const db = await connectMongo();
    return db.collection<ProductVariant>("product_variants").find({ productId }).toArray();
  }
  async getVariantById(id: string): Promise<ProductVariant | undefined> {
    const db = await connectMongo();
    const variant = await db.collection<ProductVariant>("product_variants").findOne({ id });
    return variant ?? undefined;
  }
  async createVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const db = await connectMongo();
    const doc = { ...variant, id: variant.id || new ObjectId().toString() };
    await db.collection<ProductVariant>("product_variants").insertOne(doc);
    return doc as ProductVariant;
  }

  // ORDERS
  async getOrdersBySellerId(sellerId: string): Promise<OrderItem[]> {
    const db = await connectMongo();
    return db.collection<OrderItem>("order_items").find({ sellerId }).toArray();
  }
  async getOrdersByUserId(userId: string): Promise<Order[]> {
    const db = await connectMongo();
    return db.collection<Order>("orders").find({ userId }).toArray();
  }
  async createOrder(order: InsertOrder): Promise<Order> {
    const db = await connectMongo();
    const doc = { ...order, id: order.id || new ObjectId().toString() };
    await db.collection<Order>("orders").insertOne(doc);
    return doc as Order;
  }

  // REVIEWS
  async getReviewsByProductId(productId: string): Promise<Review[]> {
    const db = await connectMongo();
    return db.collection<Review>("reviews").find({ productId }).toArray();
  }
  async createReview(review: InsertReview): Promise<Review> {
    const db = await connectMongo();
    const doc = { ...review, id: review.id || new ObjectId().toString() };
    await db.collection<Review>("reviews").insertOne(doc);
    return doc as Review;
  }

  // CART (simplificado, puedes expandir según tu lógica)
  async getCartByUserId(userId: string): Promise<CartItem[]> {
    const db = await connectMongo();
    return db.collection<CartItem>("cart_items").find({ userId }).toArray();
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
