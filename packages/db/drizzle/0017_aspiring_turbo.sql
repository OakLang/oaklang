ALTER TABLE "access_request_user_respons" RENAME TO "access_request_user_response";--> statement-breakpoint
ALTER TABLE "access_request_user_response" DROP CONSTRAINT "access_request_user_respons_user_id_question_id_option_id_unique";--> statement-breakpoint
ALTER TABLE "access_request_user_response" DROP CONSTRAINT "access_request_user_respons_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "access_request_user_response" DROP CONSTRAINT "access_request_user_respons_question_id_access_request_question_id_fk";
--> statement-breakpoint
ALTER TABLE "access_request_user_response" DROP CONSTRAINT "access_request_user_respons_option_id_access_request_question_option_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "access_request_user_response" ADD CONSTRAINT "access_request_user_response_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "access_request_user_response" ADD CONSTRAINT "access_request_user_response_question_id_access_request_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."access_request_question"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "access_request_user_response" ADD CONSTRAINT "access_request_user_response_option_id_access_request_question_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."access_request_question_option"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "access_request_user_response" ADD CONSTRAINT "access_request_user_response_user_id_question_id_option_id_unique" UNIQUE("user_id","question_id","option_id");