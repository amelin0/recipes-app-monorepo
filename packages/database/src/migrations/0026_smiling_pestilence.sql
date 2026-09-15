CREATE TYPE "public"."recipe_access" AS ENUM('free', 'paid');--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "access" "recipe_access";