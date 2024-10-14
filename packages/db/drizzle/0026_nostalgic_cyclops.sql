CREATE TABLE IF NOT EXISTS "collection" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"user_id" text NOT NULL,
	"language_code" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "module_word" (
	"module_id" text NOT NULL,
	"word_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "module" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"collection_id" text NOT NULL,
	"user_id" text NOT NULL,
	"topic" text,
	"complexity" text DEFAULT 'A1' NOT NULL,
	"language_code" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collection" ADD CONSTRAINT "collection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collection" ADD CONSTRAINT "collection_language_code_language_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."language"("code") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "module_word" ADD CONSTRAINT "module_word_module_id_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."module"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "module_word" ADD CONSTRAINT "module_word_word_id_word_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."word"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "module" ADD CONSTRAINT "module_collection_id_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "module" ADD CONSTRAINT "module_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "module" ADD CONSTRAINT "module_language_code_language_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."language"("code") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
