CREATE TABLE IF NOT EXISTS "training_session" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"language" varchar NOT NULL,
	"number_of_times_to_repeat" integer NOT NULL,
	"number_of_times_to_train" integer NOT NULL,
	"number_of_words_to_train" integer NOT NULL,
	"percent_known" real NOT NULL,
	"related_precursor" boolean NOT NULL,
	"sentence_length" integer,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "word" (
	"comprehension_prob" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"language" varchar NOT NULL,
	"marked_known" boolean DEFAULT false NOT NULL,
	"production_prob" integer DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"training_session_id" uuid NOT NULL,
	"word" varchar NOT NULL,
	CONSTRAINT "word_training_session_id_word_pk" PRIMARY KEY("training_session_id","word")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_session_language_index" ON "training_session" ("language");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "word_language_index" ON "word" ("language");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_session" ADD CONSTRAINT "training_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "word" ADD CONSTRAINT "word_training_session_id_training_session_id_fk" FOREIGN KEY ("training_session_id") REFERENCES "training_session"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
