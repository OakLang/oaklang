CREATE TABLE IF NOT EXISTS "account" (
	"access_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" integer,
	"id_token" text,
	"provider" varchar NOT NULL,
	"provider_account_id" varchar NOT NULL,
	"refresh_token" text,
	"scope" varchar,
	"session_state" varchar,
	"token_type" varchar,
	"type" varchar NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "language" (
	"id" varchar PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"name" varchar NOT NULL,
	"native_name" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires" timestamp NOT NULL,
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_session" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"language_id" varchar NOT NULL,
	"number_of_times_to_repeat" integer NOT NULL,
	"number_of_times_to_train" integer NOT NULL,
	"number_of_words_to_train" integer NOT NULL,
	"percent_known" real NOT NULL,
	"related_precursor" boolean NOT NULL,
	"sentence_length" integer,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" varchar NOT NULL,
	"email_verified" timestamp,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"name" varchar,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_token" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires" timestamp NOT NULL,
	"identifier" varchar NOT NULL,
	"token" text NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "word" (
	"comprehension_prob" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"language_id" varchar NOT NULL,
	"marked_known" boolean DEFAULT false NOT NULL,
	"production_prob" integer DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"training_session_id" uuid NOT NULL,
	"word" varchar NOT NULL,
	CONSTRAINT "word_training_session_id_word_pk" PRIMARY KEY("training_session_id","word")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_session" ADD CONSTRAINT "training_session_language_id_language_id_fk" FOREIGN KEY ("language_id") REFERENCES "language"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_session" ADD CONSTRAINT "training_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "word" ADD CONSTRAINT "word_language_id_language_id_fk" FOREIGN KEY ("language_id") REFERENCES "language"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "word" ADD CONSTRAINT "word_training_session_id_training_session_id_fk" FOREIGN KEY ("training_session_id") REFERENCES "training_session"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
