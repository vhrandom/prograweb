import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, asc, like, inArray, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { 
  User, InsertUser, 
  Product, InsertProduct,
  ProductVariant, InsertProductVariant,
  SellerProfile, InsertSellerProfile,
  Order, InsertOrder,
  Review, InsertReview,
  Category, CartItem, OrderItem
} from "@shared/schema";

const sql_client = neon(process.env.DATABASE_URL!);
const db = drizzle(sql_client, { schema });

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Seller Profiles
  getSellerProfile(userId: string): Promise<SellerProfile | undefined>;
  createSellerProfile(profile: InsertSellerProfile): Promise<SellerProfile>;
  updateSellerProfile(id: string, updates: Partial<SellerProfile>): Promise<SellerProfile | undefined>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;

  // Products
  getProducts(filters?: {
    categoryId?: string;
    search?: string;
    priceMin?: number;
    priceMax?: number;
    sellerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;

  // Product Variants
  getVariantsByProductId(productId: string): Promise<ProductVariant[]>;
  getVariantById(id: string): Promise<ProductVariant | undefined>;
  createVariant(variant: InsertProductVariant): Promise<ProductVariant>;

  // Cart
  getCartByUserId(userId: string): Promise<CartItem[]>;
  addToCart(userId: string, variantId: string, quantity: number): Promise<void>;
  updateCartItem(userId: string, variantId: string, quantity: number): Promise<void>;
  removeFromCart(userId: string, variantId: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Orders
  getOrdersByUserId(userId: string): Promise<Order[]>;
  getOrdersBySellerId(sellerId: string): Promise<OrderItem[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined>;

  // Reviews
  getReviewsByProductId(productId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(schema.users).values(user).returning();
    return created;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, id))
      .returning();
    return updated;
  }

  // Seller Profiles
  async getSellerProfile(userId: string): Promise<SellerProfile | undefined> {
    const [profile] = await db.select()
      .from(schema.sellerProfiles)
      .where(eq(schema.sellerProfiles.userId, userId));
    return profile;
  }

  async createSellerProfile(profile: InsertSellerProfile): Promise<SellerProfile> {
    const [created] = await db.insert(schema.sellerProfiles).values(profile).returning();
    return created;
  }

  async updateSellerProfile(id: string, updates: Partial<SellerProfile>): Promise<SellerProfile | undefined> {
    const [updated] = await db.update(schema.sellerProfiles)
      .set(updates)
      .where(eq(schema.sellerProfiles.id, id))
      .returning();
    return updated;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(schema.categories).orderBy(asc(schema.categories.name));
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(schema.categories).where(eq(schema.categories.id, id));
    return category;
  }

  // Products
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
    let query = db.select().from(schema.products);
    
    const conditions = [];
    
    if (filters?.categoryId) {
      conditions.push(eq(schema.products.categoryId, filters.categoryId));
    }
    
    if (filters?.sellerId) {
      conditions.push(eq(schema.products.sellerId, filters.sellerId));
    }
    
    if (filters?.status) {
      conditions.push(eq(schema.products.status, filters.status as any));
    } else {
      conditions.push(eq(schema.products.status, 'active'));
    }
    
    if (filters?.search) {
      conditions.push(like(schema.products.title, `%${filters.search}%`));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(schema.products.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(schema.products).where(eq(schema.products.slug, slug));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const slug = product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const [created] = await db.insert(schema.products)
      .values({ ...product, slug })
      .returning();
    return created;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const [updated] = await db.update(schema.products)
      .set(updates)
      .where(eq(schema.products.id, id))
      .returning();
    return updated;
  }

  // Product Variants
  async getVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    return await db.select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.productId, productId));
  }

  async getVariantById(id: string): Promise<ProductVariant | undefined> {
    const [variant] = await db.select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, id));
    return variant;
  }

  async createVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const [created] = await db.insert(schema.productVariants).values(variant).returning();
    return created;
  }

  // Cart
  async getCartByUserId(userId: string): Promise<CartItem[]> {
    const result = await db.select({
      id: schema.cartItems.id,
      cartId: schema.cartItems.cartId,
      variantId: schema.cartItems.variantId,
      quantity: schema.cartItems.quantity,
    })
    .from(schema.cartItems)
    .innerJoin(schema.carts, eq(schema.cartItems.cartId, schema.carts.id))
    .where(eq(schema.carts.userId, userId));
    
    return result;
  }

  async addToCart(userId: string, variantId: string, quantity: number): Promise<void> {
    // Get or create cart
    let [cart] = await db.select().from(schema.carts).where(eq(schema.carts.userId, userId));
    
    if (!cart) {
      [cart] = await db.insert(schema.carts).values({ userId }).returning();
    }

    // Check if item already exists
    const [existingItem] = await db.select()
      .from(schema.cartItems)
      .where(and(
        eq(schema.cartItems.cartId, cart.id),
        eq(schema.cartItems.variantId, variantId)
      ));

    if (existingItem) {
      await db.update(schema.cartItems)
        .set({ quantity: existingItem.quantity + quantity })
        .where(eq(schema.cartItems.id, existingItem.id));
    } else {
      await db.insert(schema.cartItems).values({
        cartId: cart.id,
        variantId,
        quantity
      });
    }
  }

  async updateCartItem(userId: string, variantId: string, quantity: number): Promise<void> {
    const [cart] = await db.select().from(schema.carts).where(eq(schema.carts.userId, userId));
    
    if (cart) {
      await db.update(schema.cartItems)
        .set({ quantity })
        .where(and(
          eq(schema.cartItems.cartId, cart.id),
          eq(schema.cartItems.variantId, variantId)
        ));
    }
  }

  async removeFromCart(userId: string, variantId: string): Promise<void> {
    const [cart] = await db.select().from(schema.carts).where(eq(schema.carts.userId, userId));
    
    if (cart) {
      await db.delete(schema.cartItems)
        .where(and(
          eq(schema.cartItems.cartId, cart.id),
          eq(schema.cartItems.variantId, variantId)
        ));
    }
  }

  async clearCart(userId: string): Promise<void> {
    const [cart] = await db.select().from(schema.carts).where(eq(schema.carts.userId, userId));
    
    if (cart) {
      await db.delete(schema.cartItems).where(eq(schema.cartItems.cartId, cart.id));
    }
  }

  // Orders
  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return await db.select()
      .from(schema.orders)
      .where(eq(schema.orders.userId, userId))
      .orderBy(desc(schema.orders.createdAt));
  }

  async getOrdersBySellerId(sellerId: string): Promise<OrderItem[]> {
    return await db.select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.sellerId, sellerId))
      .orderBy(desc(schema.orderItems.id));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(schema.orders).values(order).returning();
    return created;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    const [updated] = await db.update(schema.orders)
      .set(updates)
      .where(eq(schema.orders.id, id))
      .returning();
    return updated;
  }

  // Reviews
  async getReviewsByProductId(productId: string): Promise<Review[]> {
    return await db.select()
      .from(schema.reviews)
      .where(eq(schema.reviews.productId, productId))
      .orderBy(desc(schema.reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(schema.reviews).values(review).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
