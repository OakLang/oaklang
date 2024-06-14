ALTER TABLE "account" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "authenticator" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "language" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "sentence" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "training_session" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "verification_token" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "word" DROP COLUMN IF EXISTS "updated_at";