import { dbSql } from "./sql";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🔨 Inicializando base de datos SQLite...");
  
  try {
    // SQL nativo de SQLite para crear la tabla si no existe
    dbSql.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'buyer',
        name TEXT,
        created_at INTEGER
      );
    `);
    console.log("✅ Tabla 'users' verificada/creada en sqlite.db");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error inicializando SQLite:", error);
    process.exit(1);
  }
}

main();