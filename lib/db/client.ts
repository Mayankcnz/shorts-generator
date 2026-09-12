import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to connect to PostgreSQL.");
}

const globalForDatabase = globalThis as typeof globalThis & {
  postgresPool?: Pool;
};

const pool =
  globalForDatabase.postgresPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.postgresPool = pool;
}

export const database = drizzle({ client: pool });
