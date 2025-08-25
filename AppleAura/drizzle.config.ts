
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL || "file:./database.sqlite";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL no está configurada. Usando SQLite por defecto.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseUrl,
  },
});
