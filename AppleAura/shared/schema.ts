import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, uuid, smallint, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  role: text("role", { enum: ['buyer', 'seller', 'admin'] }).notNull().default('buyer'),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Seller profiles
export const sellerProfiles = pgTable("seller_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  status: text("status", { enum: ['pending', 'verified', 'rejected'] }).notNull().default('pending'),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Addresses
export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  region: text("region").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").notNull().default('Chile'),
  isDefault: boolean("is_default").notNull().default(false),
});

// Categories
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  parentId: uuid("parent_id").references(() => categories.id),
  icon: text("icon"),
});

// Products
export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid("seller_id").references(() => sellerProfiles.id).notNull(),
  categoryId: uuid("category_id").references(() => categories.id).notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  specsJson: jsonb("specs_json"),
  images: text("images").array().notNull().default(sql`'{}'::text[]`),
  status: text("status", { enum: ['draft', 'active', 'paused'] }).notNull().default('draft'),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Product variants
export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid("product_id").references(() => products.id).notNull(),
  sku: text("sku").notNull().unique(),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default('CLP'),
  attributesJson: jsonb("attributes_json"),
});

// Inventory
export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  variantId: uuid("variant_id").references(() => productVariants.id).notNull(),
  stock: integer("stock").notNull().default(0),
  reserved: integer("reserved").notNull().default(0),
});

// Carts
export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Cart items
export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  cartId: uuid("cart_id").references(() => carts.id, { onDelete: 'cascade' }).notNull(),
  variantId: uuid("variant_id").references(() => productVariants.id).notNull(),
  quantity: integer("quantity").notNull(),
});

// Orders
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  status: text("status", { 
    enum: ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled'] 
  }).notNull().default('pending'),
  totalCents: integer("total_cents").notNull(),
  currency: text("currency").notNull().default('CLP'),
  shippingAddressId: uuid("shipping_address_id").references(() => addresses.id),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  variantId: uuid("variant_id").references(() => productVariants.id).notNull(),
  sellerId: uuid("seller_id").references(() => sellerProfiles.id).notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
});

// Payments
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").references(() => orders.id).notNull().unique(),
  provider: text("provider", { enum: ['stripe', 'webpay'] }).notNull(),
  providerRef: text("provider_ref").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status", { 
    enum: ['requires_action', 'succeeded', 'failed', 'refunded'] 
  }).notNull(),
  paidAt: timestamp("paid_at"),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  rating: smallint("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Support tickets
export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  orderId: uuid("order_id").references(() => orders.id),
  subject: text("subject").notNull(),
  status: text("status", { 
    enum: ['open', 'in_progress', 'resolved', 'closed'] 
  }).notNull().default('open'),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSellerProfileSchema = createInsertSchema(sellerProfiles).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  slug: true,
});

export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SellerProfile = typeof sellerProfiles.$inferSelect;
export type InsertSellerProfile = z.infer<typeof insertSellerProfileSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Category = typeof categories.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
