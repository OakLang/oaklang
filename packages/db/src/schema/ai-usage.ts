import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const aiUsageTable = pgTable("ai_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userEmail: text("user_email"),
  userId: text("user_id"),
  generationType: text("generation_type", {
    enum: ["text", "object", "audio"],
  }),
  platform: text("platform"),
  model: text("model"),
  prompt: text("prompt"),
  tokenCount: integer("token_count"),
  result: jsonb("result"),
  metadata: jsonb("metadata"),
});
