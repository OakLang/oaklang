ALTER TABLE "access_request" RENAME COLUMN "answered_by" TO "reviewed_by";--> statement-breakpoint
ALTER TABLE "access_request" DROP CONSTRAINT "access_request_answered_by_user_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "access_request" ADD CONSTRAINT "access_request_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
