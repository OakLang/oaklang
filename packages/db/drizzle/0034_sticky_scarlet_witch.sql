DO $$ BEGIN
 CREATE TYPE "public"."sentence_interlinear_line_generation_status" AS ENUM('idle', 'pending', 'success', 'failed', 'canceled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "sentence" ADD COLUMN "interlinear_line_generation_status" "sentence_interlinear_line_generation_status" DEFAULT 'idle' NOT NULL;