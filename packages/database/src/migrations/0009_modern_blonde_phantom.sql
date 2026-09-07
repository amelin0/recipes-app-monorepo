CREATE TYPE "public"."shopping_item_origin" AS ENUM('manual', 'plan');--> statement-breakpoint
CREATE TABLE "shopping_list_items" (
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"amount_g" numeric(9, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shopping_list_items_user_id_product_id_pk" PRIMARY KEY("user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "shopping_list_marks" (
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"origin" "shopping_item_origin" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shopping_list_marks_user_id_product_id_origin_pk" PRIMARY KEY("user_id","product_id","origin")
);
--> statement-breakpoint
CREATE TABLE "shopping_list_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"import_from_plan" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_groups" ADD COLUMN "shopping_sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_groups" ADD COLUMN "is_recipe_filter" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_marks" ADD CONSTRAINT "shopping_list_marks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_marks" ADD CONSTRAINT "shopping_list_marks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_settings" ADD CONSTRAINT "shopping_list_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "product_groups" ("slug", "emoji", "sort_order", "shopping_sort_order", "is_recipe_filter") VALUES
	('flour', '🥖', 7, 2, false),
	('grains', '🌾', 8, 4, false);--> statement-breakpoint
INSERT INTO "product_group_translations" ("group_id", "language", "name")
SELECT g."id", v."language", v."name"
FROM "product_groups" g
JOIN (VALUES
	('flour', 'uk', 'Мучні'), ('flour', 'en', 'Flour'),
	('grains', 'uk', 'Крупи'), ('grains', 'en', 'Grains')
) AS v("slug", "language", "name") ON v."slug" = g."slug";--> statement-breakpoint
UPDATE "product_groups" SET "shopping_sort_order" = v."position"
FROM (VALUES
	('meat', 1),
	('dairy', 3),
	('vegetables', 5),
	('fruits', 6),
	('fish', 7),
	('sweets', 8)
) AS v("slug", "position")
WHERE "product_groups"."slug" = v."slug";
