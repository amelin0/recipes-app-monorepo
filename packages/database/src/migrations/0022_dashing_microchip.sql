ALTER TABLE "products" ADD COLUMN "name_en_key" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "dedupe_key" text;--> statement-breakpoint
-- The unique index below only protects rows that carry the key, so every
-- existing global product gets it now. A duplicate English name makes this
-- migration fail — on purpose: which of two «Tomatoes» survives is a person's
-- call, and the detection query is in the admin product catalogue plan.
UPDATE "products" p SET "name_en_key" = lower(btrim(t."name"::text))
  FROM "product_translations" t
 WHERE t."product_id" = p."id" AND t."language" = 'en' AND p."source" = 'global';--> statement-breakpoint
CREATE UNIQUE INDEX "products_global_name_en_key_unique" ON "products" USING btree ("name_en_key") WHERE "products"."source" = 'global';--> statement-breakpoint
-- Warnings already sent by the old code carry no key, so the first night after
-- deploy would warn once more. Give the key to the latest warning of each live
-- subscription — only the latest: the old code could warn twice, and two rows
-- with one key would fail the index below. The date format matches
-- `toISOString()`, which is how the worker builds the key.
UPDATE "notifications" n SET "dedupe_key" = k."key"
  FROM (
      SELECT DISTINCT ON (w."user_id", s."id")
             w."id",
             'sub-expiring:' || s."id" || ':'
                 || to_char(s."expires_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "key"
        FROM "notifications" w
        JOIN "subscriptions" s ON s."user_id" = w."user_id" AND s."status" = 'active'
       WHERE w."event" = 'subscription_expiring'
         AND w."dedupe_key" IS NULL
         AND w."created_at" >= s."expires_at" - interval '3 days'
       ORDER BY w."user_id", s."id", w."created_at" DESC
  ) k
 WHERE n."id" = k."id";--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_user_dedupe_key_unique" ON "notifications" USING btree ("user_id","dedupe_key") WHERE "notifications"."dedupe_key" is not null;
