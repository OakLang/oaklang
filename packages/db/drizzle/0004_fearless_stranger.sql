ALTER TABLE "practice_word" ALTER COLUMN "practice_count" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "practice_word" ADD COLUMN "seen_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "practice_word" ADD COLUMN "last_practiced_at" timestamp;--> statement-breakpoint
ALTER TABLE "practice_word" ADD COLUMN "times_used_since_last_practice" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "practice_word" ADD COLUMN "next_practice_at" timestamp;