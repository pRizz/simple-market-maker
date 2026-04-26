import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/modules/db/schema";

const maybeDatabaseUrl = process.env.DATABASE_URL;

if (!maybeDatabaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

export const postgresPool = new Pool({
  connectionString: maybeDatabaseUrl,
});

export const db = drizzle(postgresPool, { schema });
