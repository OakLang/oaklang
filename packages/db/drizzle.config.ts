import type { Config } from "drizzle-kit";

export default {
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  dialect: "postgresql",
  out: "drizzle",
  schema: "src/schema/index.ts",
  casing: "snake_case",
} satisfies Config;
