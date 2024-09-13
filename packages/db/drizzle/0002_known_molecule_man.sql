ALTER TABLE "user_settings" ADD COLUMN "auto_play_audio" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "tts_voice" text DEFAULT 'alloy' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "tts_speed" real DEFAULT 1 NOT NULL;