import { migrate } from "drizzle-orm/node-postgres/migrator";

import { getDbOrThrow, getPostgresPoolOrThrow } from "@/modules/db/client";

async function main(): Promise<void> {
  await migrate(getDbOrThrow(), {
    migrationsFolder: "./src/modules/db/migrations",
  });

  await getPostgresPoolOrThrow().end();
}

void main().catch((error: unknown) => {
  console.error("Database migration failed.", error);
  process.exitCode = 1;
});
