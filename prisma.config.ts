import { defineConfig } from "prisma/config";
import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";

if (existsSync(".env.production")) {
  loadEnv({ path: ".env.production" });
} else {
  loadEnv();
}

// DATABASE_URL points at the local SQLite file (e.g. file:./prisma/dev.db)
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
