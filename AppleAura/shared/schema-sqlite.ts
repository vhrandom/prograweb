import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("buyer"), // 'buyer', 'seller', 'admin'
  name: text("name"),
  // mode: 'timestamp' convierte automáticamente entre Date y el formato de SQLite
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()), 
});