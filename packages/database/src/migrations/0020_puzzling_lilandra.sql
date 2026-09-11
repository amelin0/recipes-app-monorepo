-- One active deletion request per account. Before the index can exist, any
-- duplicates a double tap already left behind have to go — and which one stays
-- matters legally: «keep the earliest» alone would keep exactly the twin that a
-- cancel missed, and erase an account its owner restored.
LOCK TABLE "account_deletion_requests" IN SHARE ROW EXCLUSIVE MODE;--> statement-breakpoint
-- 1. An active row created before a cancel by the same user is the twin that
--    cancel missed: a real re-request is always created after the cancel.
--    Stamp it with the user's actual cancel time.
UPDATE "account_deletion_requests" r SET "cancelled_at" = c.last_cancel
FROM (
    SELECT "user_id", max("cancelled_at") AS last_cancel
    FROM "account_deletion_requests"
    WHERE "cancelled_at" IS NOT NULL
    GROUP BY "user_id"
) c
WHERE r."user_id" = c."user_id"
  AND r."cancelled_at" IS NULL
  AND r."executed_at" IS NULL
  AND r."created_at" < c.last_cancel;--> statement-breakpoint
-- 2. Of what is left, keep the earliest active request — the one the fixed code
--    would have accepted, so no deadline moves — and delete the pure duplicates
--    (stamping them cancelled would record a cancel nobody made).
DELETE FROM "account_deletion_requests" r
USING (
    SELECT "id", row_number() OVER (PARTITION BY "user_id" ORDER BY "created_at", "scheduled_for", "id") AS rn
    FROM "account_deletion_requests"
    WHERE "cancelled_at" IS NULL AND "executed_at" IS NULL
) d
WHERE r."id" = d."id" AND d.rn > 1;--> statement-breakpoint
CREATE UNIQUE INDEX "account_deletion_requests_one_active_per_user" ON "account_deletion_requests" USING btree ("user_id") WHERE "account_deletion_requests"."cancelled_at" is null and "account_deletion_requests"."executed_at" is null;
