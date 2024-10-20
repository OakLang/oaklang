DO $$ BEGIN
 CREATE TYPE "public"."training_session_status" AS ENUM('idle', 'pending', 'success', 'error', 'canceled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_usage" (
	"ai" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_email" text,
	"user_id" text,
	"generation_type" text,
	"platform" text,
	"model" text,
	"prompt" text,
	"token_count" integer,
	"result" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "training_session" ADD COLUMN "status" "training_session_status" DEFAULT 'idle' NOT NULL;