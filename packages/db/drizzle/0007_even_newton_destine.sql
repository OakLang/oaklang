ALTER TABLE "user_word" ADD COLUMN "created_from_id" text;--> statement-breakpoint
ALTER TABLE "user_word" ADD COLUMN "known_from_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_word_created_from_id_index" ON "user_word" USING btree ("created_from_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_word_known_from_id_index" ON "user_word" USING btree ("known_from_id");