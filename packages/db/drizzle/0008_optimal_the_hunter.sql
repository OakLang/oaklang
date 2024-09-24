ALTER TABLE "user_word" ALTER COLUMN "last_seen_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_word" ALTER COLUMN "last_seen_at" DROP NOT NULL;