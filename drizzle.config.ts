import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

const isTestDatabase = process.env.DATABASE_TARGET === "test";

const databaseUrl = isTestDatabase ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    isTestDatabase
      ? "TEST_DATABASE_URL is required."
      : "DATABASE_URL is required.",
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
