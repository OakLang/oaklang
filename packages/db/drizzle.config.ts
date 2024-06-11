import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
});
