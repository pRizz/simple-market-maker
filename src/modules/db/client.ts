import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/modules/db/schema";

function maybeDatabaseUrl(): string | null {
  const maybeValue = process.env.DATABASE_URL;

  if (!maybeValue || !maybeValue.trim()) {
    return null;
  }

  return maybeValue;
}

let maybePostgresPool: Pool | null = null;

export function getPostgresPool(): Pool | null {
  if (maybePostgresPool) {
    return maybePostgresPool;
  }

  const databaseUrl = maybeDatabaseUrl();

  if (!databaseUrl) {
    return null;
  }

  maybePostgresPool = new Pool({
    connectionString: databaseUrl,
  });

  return maybePostgresPool;
}

export function getPostgresPoolOrThrow(): Pool {
  const maybePool = getPostgresPool();

  if (!maybePool) {
    throw new Error("DATABASE_URL is required.");
  }

  return maybePool;
}

export const maybeDb = maybeDatabaseUrl()
  ? drizzle(getPostgresPoolOrThrow(), { schema })
  : null;

export function getDbOrThrow() {
  if (!maybeDb) {
    throw new Error("DATABASE_URL is required.");
  }

  return maybeDb;
}
