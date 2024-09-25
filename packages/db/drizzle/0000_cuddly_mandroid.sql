CREATE TABLE IF NOT EXISTS "account" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authenticator" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"credential_id" text NOT NULL,
	"user_id" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"credential_public_key" text NOT NULL,
	"counter" integer NOT NULL,
	"credential_device_type" text NOT NULL,
	"credential_backed_up" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticator_user_id_credential_id_pk" PRIMARY KEY("user_id","credential_id"),
	CONSTRAINT "authenticator_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_token" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"interlinear_lines" jsonb DEFAULT '[{"id":"01J8JCN4RNPKJZG64219443K5W","name":"text","style":{"fontFamily":"Times New Roman"},"description":"whitespace delimited text associated with word from the full sentence including capitalization and punctuation","disappearing":"default","hidden":false},{"id":"01J8JCN8ZV0F4VN91GDSN4Q4HR","name":"word","style":{"fontFamily":"Times New Roman","fontWeight":"500"},"description":"word in {{PRACTICE_LANGUAGE}} without whitespace or punctuation or capitalization","disappearing":"default","hidden":false},{"id":"01J8JCND9FJ5AHP5PAXADQVGT9","name":"lemma","style":{"fontFamily":"Times New Roman"},"description":"word in lemma form","disappearing":"default","hidden":false},{"id":"4V908jRdQDbyVmUECtbZj","name":"translation","style":{"fontFamily":"Times New Roman"},"description":"word translation in {{NATIVE_LANGUAGE}}","disappearing":"default","hidden":false},{"id":"01J8JCNHPZMM9M0WPP8DHFSNR5","name":"ipa","style":{"fontFamily":"Times New Roman"},"description":"word pronunciation in IPA format","disappearing":"default","hidden":false},{"id":"01J8JCNNZYACY187W8TE7M7S9B","name":"pronunciation","style":{"fontFamily":"Times New Roman"},"description":"phonetic word pronunciation in {{NATIVE_LANGUAGE}}","disappearing":"default","hidden":false},{"id":"01J8JCNVPVTAXM8XF81M5ZM2YJ","name":"grammar","style":{"fontStyle":"italic"},"description":"Provide an abbreviated grammatical analysis of the word in this context using standard grammatical abbreviations (e.g., adj m s nom), including part of speech, gender, number, case, tense, and other relevant details.","disappearing":"default","hidden":true}]'::jsonb NOT NULL,
	"spaced_repetition_stages" jsonb DEFAULT '[{"id":"01J8JCKTK8EH36035PXZ16901M","iteration":1,"waitTime":"0","repetitions":5,"timesToShowDisappearing":3},{"id":"01J8JCMFQTDVAJ606MCDR9HJ6Y","iteration":2,"waitTime":"10m","repetitions":5,"timesToShowDisappearing":3},{"id":"01J8JCMP8Q01WX9Z6N6SJQZEXC","iteration":3,"waitTime":"1d","repetitions":4,"timesToShowDisappearing":1},{"id":"01J8JCMWB9HTBJJJ6R4ADS00MH","iteration":4,"waitTime":"5d","repetitions":6,"timesToShowDisappearing":1}]'::jsonb NOT NULL,
	"auto_play_audio" boolean DEFAULT true NOT NULL,
	"tts_voice" text DEFAULT 'alloy' NOT NULL,
	"tts_speed" real DEFAULT 1 NOT NULL,
	"native_language" text,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "language" (
	"code" text PRIMARY KEY NOT NULL,
	"country_code" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "practice_language" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_practiced" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"language_code" text NOT NULL,
	CONSTRAINT "practice_language_user_id_language_code_pk" PRIMARY KEY("user_id","language_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_session" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"sentence_index" integer DEFAULT 0 NOT NULL,
	"complexity" text DEFAULT 'A1' NOT NULL,
	"language_code" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "word" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"word" text NOT NULL,
	"language_code" text NOT NULL,
	CONSTRAINT "word_word_language_code_unique" UNIQUE("word","language_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sentence_word" (
	"sentence_id" text NOT NULL,
	"word_id" text NOT NULL,
	"index" integer NOT NULL,
	"interlinear_lines" jsonb NOT NULL,
	CONSTRAINT "sentence_word_sentence_id_index_unique" UNIQUE("sentence_id","index")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sentence" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"training_session_id" text NOT NULL,
	"sentence" text NOT NULL,
	"translation" text NOT NULL,
	"index" integer NOT NULL,
	CONSTRAINT "sentence_training_session_id_index_unique" UNIQUE("training_session_id","index")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_word" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"word_id" text NOT NULL,
	"user_id" text NOT NULL,
	"known_at" timestamp,
	"last_seen_at" timestamp,
	"seen_count" integer DEFAULT 0 NOT NULL,
	"last_practiced_at" timestamp,
	"practice_count" integer DEFAULT 0 NOT NULL,
	"seen_count_since_last_practiced" integer DEFAULT 0 NOT NULL,
	"next_practice_at" timestamp,
	"spaced_repetition_stage" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "user_word_user_id_word_id_unique" UNIQUE("user_id","word_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_native_language_language_code_fk" FOREIGN KEY ("native_language") REFERENCES "public"."language"("code") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_language" ADD CONSTRAINT "practice_language_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_language" ADD CONSTRAINT "practice_language_language_code_language_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."language"("code") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_session" ADD CONSTRAINT "training_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_session" ADD CONSTRAINT "training_session_language_code_language_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."language"("code") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "word" ADD CONSTRAINT "word_language_code_language_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."language"("code") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sentence_word" ADD CONSTRAINT "sentence_word_sentence_id_sentence_id_fk" FOREIGN KEY ("sentence_id") REFERENCES "public"."sentence"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sentence_word" ADD CONSTRAINT "sentence_word_word_id_word_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."word"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sentence" ADD CONSTRAINT "sentence_training_session_id_training_session_id_fk" FOREIGN KEY ("training_session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_word" ADD CONSTRAINT "user_word_word_id_word_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."word"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_word" ADD CONSTRAINT "user_word_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
