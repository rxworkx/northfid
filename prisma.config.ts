import { defineConfig } from "prisma/config";
import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";

if (existsSync(".env.production")) {
  loadEnv({ path: ".env.production" });
} else {
  loadEnv();
}

// DIRECT_URL bypasses the pooler — required for migrations/db push
// DATABASE_URL is the transaction pooler — used by the app at runtime
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
