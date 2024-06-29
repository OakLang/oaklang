ALTER TABLE "word" ADD COLUMN "marked_known_at" timestamp;--> statement-breakpoint
ALTER TABLE "word" DROP COLUMN IF EXISTS "is_known";