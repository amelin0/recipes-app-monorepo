CREATE TABLE "store_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store" "purchase_store" NOT NULL,
	"transaction_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" text NOT NULL,
	"plan_id" uuid,
	"is_trial" boolean NOT NULL,
	"price_cents" integer,
	"currency" text,
	"started_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"subscription_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_transactions" ADD CONSTRAINT "store_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_transactions" ADD CONSTRAINT "store_transactions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_transactions" ADD CONSTRAINT "store_transactions_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "store_transactions_store_transaction_idx" ON "store_transactions" USING btree ("store","transaction_id");--> statement-breakpoint
CREATE INDEX "store_transactions_user_idx" ON "store_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "store_transactions_subscription_idx" ON "store_transactions" USING btree ("subscription_id");--> statement-breakpoint
-- Every receipt already stored becomes a ledger row, so the ledger is complete
-- from the first day rather than filling in as old receipts get replayed.
-- expires_at comes from the subscription row, so a reward month already added
-- onto it reads as billed: carry-over can only under-grant from this, never over.
INSERT INTO "store_transactions"
    ("store", "transaction_id", "user_id", "product_id", "plan_id", "is_trial",
     "price_cents", "currency", "started_at", "expires_at", "subscription_id", "created_at")
SELECT s."store", s."store_transaction_id", s."user_id",
       coalesce(CASE s."store" WHEN 'google' THEN p."google_product_id" ELSE p."apple_product_id" END, ''),
       s."plan_id", s."source" = 'trial', s."price_paid_cents", s."currency",
       s."started_at", s."expires_at", s."id", s."created_at"
FROM "subscriptions" s
JOIN "subscription_plans" p ON p."id" = s."plan_id"
WHERE s."store_transaction_id" IS NOT NULL
ON CONFLICT ("store", "transaction_id") DO NOTHING;
