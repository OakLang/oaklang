DO $$ BEGIN
 CREATE TYPE "public"."training_session_view" AS ENUM('scroll', 'page', 'sentence');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "training_session" ADD COLUMN "view" "training_session_view" DEFAULT 'sentence' NOT NULL;