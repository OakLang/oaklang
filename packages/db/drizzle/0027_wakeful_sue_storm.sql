ALTER TABLE "module" ADD COLUMN "json_data" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "module" DROP COLUMN IF EXISTS "topic";--> statement-breakpoint
ALTER TABLE "module" DROP COLUMN IF EXISTS "complexity";