ALTER TABLE "user_word" ADD COLUMN "marked_unknown_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_word" ADD COLUMN "last_marked_unknown_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_word" ADD COLUMN "dissabled_hide_lines_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_word" ADD COLUMN "last_dissabled_hide_lines_at" timestamp;