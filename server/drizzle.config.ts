import { string } from "better-auth";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.NEON_DATABASE_URL! },
  strict: true,
  verbose: true,
});
