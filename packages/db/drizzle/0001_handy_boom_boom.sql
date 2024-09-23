CREATE TABLE IF NOT EXISTS "practice_word" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"word_id" text NOT NULL,
	"user_id" text NOT NULL,
	"practice_count" integer DEFAULT 0 NOT NULL,
	"known_at" timestamp,
	CONSTRAINT "practice_word_user_id_word_id_unique" UNIQUE("user_id","word_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_word" ADD CONSTRAINT "practice_word_word_id_word_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."word"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_word" ADD CONSTRAINT "practice_word_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
