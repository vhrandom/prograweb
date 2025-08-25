import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/appleaura_dev";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL no está configurada. Usando configuración por defecto.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
