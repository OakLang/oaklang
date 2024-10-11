CREATE TABLE IF NOT EXISTS "training_session_word" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"training_session_id" text NOT NULL,
	"word_id" text NOT NULL,
	CONSTRAINT "training_session_word_training_session_id_word_id_pk" PRIMARY KEY("training_session_id","word_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_session_word" ADD CONSTRAINT "training_session_word_training_session_id_training_session_id_fk" FOREIGN KEY ("training_session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_session_word" ADD CONSTRAINT "training_session_word_word_id_word_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."word"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
