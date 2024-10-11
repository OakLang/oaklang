DO $$ BEGIN
 CREATE TYPE "public"."access_request_status" AS ENUM('pending', 'accepted', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "access_request" ADD COLUMN "status" "access_request_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "access_request" ADD COLUMN "answered_by" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "access_request" ADD CONSTRAINT "access_request_answered_by_user_id_fk" FOREIGN KEY ("answered_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
