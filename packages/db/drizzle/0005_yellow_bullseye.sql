ALTER TABLE "training_session" ALTER COLUMN "sentence_index" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sentence" ADD COLUMN "index" integer NOT NULL;