ALTER TABLE "practice_word" RENAME TO "user_word";--> statement-breakpoint
ALTER TABLE "user_word" DROP CONSTRAINT "practice_word_user_id_word_id_unique";--> statement-breakpoint
ALTER TABLE "user_word" DROP CONSTRAINT "practice_word_word_id_word_id_fk";
--> statement-breakpoint
ALTER TABLE "user_word" DROP CONSTRAINT "practice_word_user_id_user_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_word" ADD CONSTRAINT "user_word_word_id_word_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."word"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_word" ADD CONSTRAINT "user_word_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "user_word" ADD CONSTRAINT "user_word_user_id_word_id_unique" UNIQUE("user_id","word_id");