ALTER TYPE "public"."notification_event" ADD VALUE 'referral_rewarded';--> statement-breakpoint
ALTER TABLE "referral_redemptions" ADD COLUMN "rewarded_at" timestamp with time zone;