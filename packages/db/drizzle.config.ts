import type { Config } from "drizzle-kit";

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}


export default {
  schema: "./src/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: DATABASE_URL },
} satisfies Config;
