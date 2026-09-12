ALTER TABLE "users" ADD COLUMN "sessions_valid_from" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "sessions_valid_from" timestamp with time zone;