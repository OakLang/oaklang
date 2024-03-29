CREATE TABLE IF NOT EXISTS "AuditLog" (
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"event" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"ip" varchar,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"userAgent" varchar,
	"userId" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"bio" varchar,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"sessionId" varchar NOT NULL,
	"fullName" varchar,
	CONSTRAINT "User_sessionId_unique" UNIQUE("sessionId")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_index" ON "AuditLog" ("userId","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AuditLog_userId_index" ON "AuditLog" ("userId");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
