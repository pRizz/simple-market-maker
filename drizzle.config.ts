import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/modules/db/schema.ts",
  out: "./src/modules/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
