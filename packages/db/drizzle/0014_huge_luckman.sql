CREATE TABLE IF NOT EXISTS "access_request_question_option" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"question_id" uuid NOT NULL,
	"option" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "access_request_question" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"question" text NOT NULL,
	"is_multi_choice" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "access_request_user_respons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"question_id" uuid NOT NULL,
	"option_id" uuid,
	"custom_answer" text,
	CONSTRAINT "access_request_user_respons_user_id_question_id_option_id_unique" UNIQUE("user_id","question_id","option_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "access_request" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "access_request_question_option" ADD CONSTRAINT "access_request_question_option_question_id_access_request_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."access_request_question"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "access_request_user_respons" ADD CONSTRAINT "access_request_user_respons_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "access_request_user_respons" ADD CONSTRAINT "access_request_user_respons_question_id_access_request_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."access_request_question"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "access_request_user_respons" ADD CONSTRAINT "access_request_user_respons_option_id_access_request_question_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."access_request_question_option"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "access_request" ADD CONSTRAINT "access_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
