ALTER TABLE "training_session" DROP CONSTRAINT "training_session_language_id_language_id_fk";
--> statement-breakpoint
ALTER TABLE "user_preference" DROP CONSTRAINT "user_preference_language_id_language_id_fk";
--> statement-breakpoint
ALTER TABLE "training_session" ALTER COLUMN "language_id" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_session" ADD CONSTRAINT "training_session_language_id_language_id_fk" FOREIGN KEY ("language_id") REFERENCES "language"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_language_id_language_id_fk" FOREIGN KEY ("language_id") REFERENCES "language"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
