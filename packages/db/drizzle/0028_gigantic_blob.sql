ALTER TABLE "training_session" ADD COLUMN "exercise" text DEFAULT 'exercise-1' NOT NULL;--> statement-breakpoint
ALTER TABLE "training_session" ADD COLUMN "data" jsonb DEFAULT '{"complexity":"A1","topic":"","words":[]}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "training_session" DROP COLUMN IF EXISTS "complexity";--> statement-breakpoint
ALTER TABLE "training_session" DROP COLUMN IF EXISTS "topic";