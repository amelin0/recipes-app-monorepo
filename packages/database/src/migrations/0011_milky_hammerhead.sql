CREATE TYPE "public"."billing_period" AS ENUM('month', 'year');--> statement-breakpoint
CREATE TYPE "public"."purchase_store" AS ENUM('apple', 'google', 'none');--> statement-breakpoint
CREATE TYPE "public"."subscription_source" AS ENUM('purchase', 'trial', 'referral');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "plan_feature_translations" (
	"feature_id" uuid NOT NULL,
	"language" text NOT NULL,
	"title" text NOT NULL,
	CONSTRAINT "plan_feature_translations_feature_id_language_pk" PRIMARY KEY("feature_id","language")
);
--> statement-breakpoint
CREATE TABLE "plan_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"emoji" text,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plan_features_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referral_redemptions" (
	"redeemer_user_id" uuid PRIMARY KEY NOT NULL,
	"referrer_user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plan_translations" (
	"plan_id" uuid NOT NULL,
	"language" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "subscription_plan_translations_plan_id_language_pk" PRIMARY KEY("plan_id","language")
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"period" "billing_period" NOT NULL,
	"price_cents" integer NOT NULL,
	"full_price_cents" integer,
	"currency" text DEFAULT 'USD' NOT NULL,
	"trial_days" integer DEFAULT 0 NOT NULL,
	"apple_product_id" text,
	"google_product_id" text,
	"sort_order" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"source" "subscription_source" NOT NULL,
	"status" "subscription_status" NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"price_paid_cents" integer NOT NULL,
	"full_price_cents" integer,
	"currency" text NOT NULL,
	"referral_code" text,
	"store" "purchase_store" NOT NULL,
	"store_transaction_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_store_transaction_id_unique" UNIQUE("store_transaction_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "paywall_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "plan_feature_translations" ADD CONSTRAINT "plan_feature_translations_feature_id_plan_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."plan_features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_redemptions" ADD CONSTRAINT "referral_redemptions_redeemer_user_id_users_id_fk" FOREIGN KEY ("redeemer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_redemptions" ADD CONSTRAINT "referral_redemptions_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_plan_translations" ADD CONSTRAINT "subscription_plan_translations_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "referral_redemptions_referrer_idx" ON "referral_redemptions" USING btree ("referrer_user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_one_active_per_user" ON "subscriptions" USING btree ("user_id") WHERE "subscriptions"."status" = 'active';
--> statement-breakpoint
INSERT INTO "subscription_plans" ("slug", "period", "price_cents", "full_price_cents", "currency", "trial_days", "apple_product_id", "google_product_id", "sort_order", "is_default") VALUES
	('annual', 'year', 5999, 11988, 'USD', 7, 'com.rationfit.application.annual', 'rationfit_annual', 1, true),
	('monthly', 'month', 999, NULL, 'USD', 0, 'com.rationfit.application.monthly', 'rationfit_monthly', 2, false);--> statement-breakpoint
INSERT INTO "subscription_plan_translations" ("plan_id", "language", "name")
SELECT p."id", v."language", v."name"
FROM "subscription_plans" p
JOIN (VALUES
	('annual', 'uk', 'Річний план'), ('annual', 'en', 'Annual plan'),
	('monthly', 'uk', 'Місячний план'), ('monthly', 'en', 'Monthly plan')
) AS v("slug", "language", "name") ON v."slug" = p."slug";--> statement-breakpoint
INSERT INTO "plan_features" ("slug", "sort_order") VALUES
	('recipes', 1),
	('meal-plan', 2),
	('shopping-list', 3),
	('own-recipes', 4),
	('progress', 5);--> statement-breakpoint
INSERT INTO "plan_feature_translations" ("feature_id", "language", "title")
SELECT f."id", v."language", v."title"
FROM "plan_features" f
JOIN (VALUES
	('recipes', 'uk', 'Бібліотека з 2000+ рецептів'),
	('meal-plan', 'uk', 'План харчування'),
	('shopping-list', 'uk', 'Автоматичні списки покупок'),
	('own-recipes', 'uk', 'Додавання власних рецептів'),
	('progress', 'uk', 'Відслідковування статистики та прогресу')
) AS v("slug", "language", "title") ON v."slug" = f."slug";
