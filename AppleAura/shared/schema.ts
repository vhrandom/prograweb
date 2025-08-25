import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, blob, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  role: text("role", { enum: ['buyer', 'seller', 'admin'] }).notNull().default('buyer'),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Seller profiles
export const sellerProfiles = sqliteTable("seller_profiles", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  status: text("status", { enum: ['pending', 'verified', 'rejected'] }).notNull().default('pending'),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Categories
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  description: text("description"),
  parentId: text("parent_id").references(() => categories.id),
  icon: text("icon"),
});

// Products
export const products = sqliteTable("products", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  sellerId: text("seller_id").references(() => sellerProfiles.id).notNull(),
  categoryId: text("category_id").references(() => categories.id).notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  specsJson: text("specs_json"),
  images: text("images").notNull().default('[]'),
  status: text("status", { enum: ['draft', 'active', 'inactive'] }).notNull().default('draft'),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Product variants
export const productVariants = sqliteTable("product_variants", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  productId: text("product_id").references(() => products.id).notNull(),
  sku: text("sku").notNull().unique(),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default('CLP'),
  attributesJson: text("attributes_json"),
});

// Reviews
export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  productId: text("product_id").references(() => products.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Carts
export const carts = sqliteTable("carts", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Cart items
export const cartItems = sqliteTable("cart_items", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  cartId: text("cart_id").references(() => carts.id).notNull(),
  variantId: text("variant_id").references(() => productVariants.id).notNull(),
  quantity: integer("quantity").notNull(),
});

// Orders
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  status: text("status", { enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] }).notNull().default('pending'),
  totalCents: integer("total_cents").notNull(),
  currency: text("currency").notNull().default('CLP'),
  shippingAddressId: text("shipping_address_id"),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Order items
export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  orderId: text("order_id").references(() => orders.id).notNull(),
  variantId: text("variant_id").references(() => productVariants.id).notNull(),
  sellerId: text("seller_id").references(() => sellerProfiles.id).notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SellerProfile = typeof sellerProfiles.$inferSelect;
export type InsertSellerProfile = typeof sellerProfiles.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

// Schemas for validation
export const insertSellerProfileSchema = createInsertSchema(sellerProfiles);

// Addresses
export const addresses = sqliteTable("addresses", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  region: text("region").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").notNull().default('Chile'),
  isDefault: integer("is_default", { mode: 'boolean' }).notNull().default(false),
});

// Categories
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  description: text("description"),
  parentId: text("parent_id").references(() => categories.id),
  icon: text("icon"),
});

// Products
export const products = sqliteTable("products", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  sellerId: text("seller_id").references(() => sellerProfiles.id).notNull(),
  categoryId: text("category_id").references(() => categories.id).notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  specsJson: text("specs_json", { mode: 'json' }),
  images: text("images", { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  status: text("status", { enum: ['draft', 'active', 'paused'] }).notNull().default('draft'),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Product variants
export const productVariants = sqliteTable("product_variants", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  productId: text("product_id").references(() => products.id).notNull(),
  sku: text("sku").notNull().unique(),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default('CLP'),
  attributesJson: text("attributes_json", { mode: 'json' }),
});

// Inventory
export const inventory = sqliteTable("inventory", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  variantId: text("variant_id").references(() => productVariants.id).notNull(),
  stock: integer("stock").notNull().default(0),
  reserved: integer("reserved").notNull().default(0),
});

// Carts
export const carts = sqliteTable("carts", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Cart items
export const cartItems = sqliteTable("cart_items", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  cartId: text("cart_id").references(() => carts.id, { onDelete: 'cascade' }).notNull(),
  variantId: text("variant_id").references(() => productVariants.id).notNull(),
  quantity: integer("quantity").notNull(),
});

// Orders
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  status: text("status", { 
    enum: ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled'] 
  }).notNull().default('pending'),
  totalCents: integer("total_cents").notNull(),
  currency: text("currency").notNull().default('CLP'),
  shippingAddressId: text("shipping_address_id").references(() => addresses.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Order items
export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  orderId: text("order_id").references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  variantId: text("variant_id").references(() => productVariants.id).notNull(),
  sellerId: text("seller_id").references(() => sellerProfiles.id).notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
});

// Payments
export const payments = sqliteTable("payments", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  orderId: text("order_id").references(() => orders.id).notNull().unique(),
  provider: text("provider", { enum: ['stripe', 'webpay'] }).notNull(),
  providerRef: text("provider_ref").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status", { 
    enum: ['requires_action', 'succeeded', 'failed', 'refunded'] 
  }).notNull(),
  paidAt: integer("paid_at", { mode: 'timestamp' }),
});

// Reviews
export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  productId: text("product_id").references(() => products.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Support tickets
export const supportTickets = sqliteTable("support_tickets", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  orderId: text("order_id").references(() => orders.id),
  subject: text("subject").notNull(),
  status: text("status", { 
    enum: ['open', 'in_progress', 'resolved', 'closed'] 
  }).notNull().default('open'),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Insert schemas for validation
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
  slug: true,
  createdAt: true,
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

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type SellerProfile = typeof sellerProfiles.$inferSelect;
export type InsertSellerProfile = typeof sellerProfiles.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = typeof addresses.$inferInsert;