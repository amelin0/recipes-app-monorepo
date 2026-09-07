CREATE TYPE "public"."gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."user_goal" AS ENUM('maintain', 'gain-muscle', 'lose-weight', 'learn-cooking');--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "weight_kg" numeric(5, 1);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "height_cm" numeric(4, 1);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "activity_level" smallint;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "goal" "user_goal";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "target_weight_kg" numeric(5, 1);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "onboarding_step" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "onboarding_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "recommended_calories" integer;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "recommended_water_ml" integer;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "recommended_steps" integer;