import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "shared/schema-sqlite";

// Esto creará (o usará) un archivo 'sqlite.db' en la raíz de tu proyecto
const sqlite = new Database('sqlite.db');

export const dbSql = drizzle(sqlite, { schema });