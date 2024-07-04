ALTER TABLE "word" ADD COLUMN "is_known" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "word" ADD COLUMN "is_practicing" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "word" DROP COLUMN IF EXISTS "marked_known_at";