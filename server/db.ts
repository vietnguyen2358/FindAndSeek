import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Create mock DB objects if DATABASE_URL is not set
let pool: any;
let db: any;

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL not set. Database functionality will not work!");
  // Create mock objects to prevent errors
  pool = {
    query: async () => ({ rows: [] }),
    connect: async () => ({}),
  };
  db = {
    query: async () => [],
    select: () => ({ from: () => ({}) }),
    insert: () => ({ values: () => ({}) }),
    update: () => ({ set: () => ({}) }),
    delete: () => ({}),
  };
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { pool, db };
