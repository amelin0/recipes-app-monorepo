CREATE TYPE "public"."meal_slot" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TABLE "nutrition_goals" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"daily_calories" integer NOT NULL,
	"daily_protein_g" integer NOT NULL,
	"daily_fats_g" integer NOT NULL,
	"daily_carbs_g" integer NOT NULL,
	"daily_water_ml" integer NOT NULL,
	"daily_fiber_g" integer NOT NULL,
	"daily_steps_target" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_log_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"slot" "meal_slot" NOT NULL,
	"recipe_id" uuid,
	"dish_name" text NOT NULL,
	"portions" integer NOT NULL,
	"eaten_fraction" numeric(4, 3) NOT NULL,
	"credited_calories" integer NOT NULL,
	"credited_protein_g" numeric(7, 2) NOT NULL,
	"credited_fats_g" numeric(7, 2) NOT NULL,
	"credited_carbs_g" numeric(7, 2) NOT NULL,
	"credited_weight_g" numeric(8, 2) NOT NULL,
	"total_weight_g" numeric(8, 2) NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "water_log_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"amount_ml" integer NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_steps" (
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"steps" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_steps_user_id_log_date_pk" PRIMARY KEY("user_id","log_date")
);
--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD CONSTRAINT "nutrition_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_log_entries" ADD CONSTRAINT "meal_log_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water_log_entries" ADD CONSTRAINT "water_log_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_steps" ADD CONSTRAINT "daily_steps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meal_log_entries_user_date_idx" ON "meal_log_entries" USING btree ("user_id","log_date");--> statement-breakpoint
CREATE INDEX "water_log_entries_user_date_idx" ON "water_log_entries" USING btree ("user_id","log_date");