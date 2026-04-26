import { migrate } from "drizzle-orm/node-postgres/migrator";

import { db, postgresPool } from "@/modules/db/client";

async function main(): Promise<void> {
  await migrate(db, {
    migrationsFolder: "./src/modules/db/migrations",
  });

  await postgresPool.end();
}

void main().catch((error: unknown) => {
  console.error("Database migration failed.", error);
  process.exitCode = 1;
});
