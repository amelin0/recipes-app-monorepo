ALTER TABLE "refresh_tokens" ADD COLUMN "grace_used_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "otp_codes" ADD COLUMN "password_hash" text;--> statement-breakpoint
-- One live code per account and purpose. Two resends racing each other could
-- already have left two; keep the newest, which is the one the person was
-- told to type.
DELETE FROM "otp_codes" AS older
 USING "otp_codes" AS newer
 WHERE older."user_id" = newer."user_id"
   AND older."purpose" = newer."purpose"
   AND older."consumed_at" IS NULL
   AND newer."consumed_at" IS NULL
   AND (older."created_at", older."id") < (newer."created_at", newer."id");--> statement-breakpoint
CREATE UNIQUE INDEX "otp_codes_one_live_per_purpose" ON "otp_codes" USING btree ("user_id","purpose") WHERE "otp_codes"."consumed_at" is null;--> statement-breakpoint
-- A registration's password now lives with its confirmation code and becomes
-- the account's only when that code is confirmed. Move the pending passwords
-- of accounts registered before this change onto their live codes, so every
-- unconfirmed account follows one model.
UPDATE "otp_codes" o SET "password_hash" = u."password_hash"
  FROM "users" u
 WHERE o."user_id" = u."id"
   AND o."purpose" = 'email_verification'
   AND o."consumed_at" IS NULL
   AND o."password_hash" IS NULL
   AND u."email_verified_at" IS NULL
   AND u."password_hash" IS NOT NULL;--> statement-breakpoint
UPDATE "users" u SET "password_hash" = NULL
 WHERE u."email_verified_at" IS NULL
   AND EXISTS (
       SELECT 1 FROM "otp_codes" o
        WHERE o."user_id" = u."id"
          AND o."purpose" = 'email_verification'
          AND o."consumed_at" IS NULL
          AND o."password_hash" = u."password_hash"
   );
