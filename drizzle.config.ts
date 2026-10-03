import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
config({ path: ".env.local", quiet: true });
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
