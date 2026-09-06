CREATE TYPE "public"."content_source" AS ENUM('global', 'custom');--> statement-breakpoint
CREATE TABLE "dish_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"emoji" text,
	"image_url" text,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dish_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dish_category_translations" (
	"category_id" uuid NOT NULL,
	"language" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "dish_category_translations_category_id_language_pk" PRIMARY KEY("category_id","language")
);
--> statement-breakpoint
CREATE TABLE "cuisine_translations" (
	"cuisine_id" uuid NOT NULL,
	"language" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "cuisine_translations_cuisine_id_language_pk" PRIMARY KEY("cuisine_id","language")
);
--> statement-breakpoint
CREATE TABLE "cuisines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"emoji" text,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cuisines_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "diet_translations" (
	"diet_id" uuid NOT NULL,
	"language" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "diet_translations_diet_id_language_pk" PRIMARY KEY("diet_id","language")
);
--> statement-breakpoint
CREATE TABLE "diets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"emoji" text,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_group_translations" (
	"group_id" uuid NOT NULL,
	"language" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "product_group_translations_group_id_language_pk" PRIMARY KEY("group_id","language")
);
--> statement-breakpoint
CREATE TABLE "product_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"emoji" text,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_groups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_translations" (
	"product_id" uuid NOT NULL,
	"language" text NOT NULL,
	"name" text NOT NULL,
	"serving_label" text,
	CONSTRAINT "product_translations_product_id_language_pk" PRIMARY KEY("product_id","language")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "content_source" NOT NULL,
	"group_id" uuid,
	"calories_per_100g" numeric(7, 2) NOT NULL,
	"protein_per_100g" numeric(7, 2) NOT NULL,
	"fats_per_100g" numeric(7, 2) NOT NULL,
	"carbs_per_100g" numeric(7, 2) NOT NULL,
	"serving_weight_g" numeric(7, 2),
	"is_quick_pick" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_translations" (
	"recipe_id" uuid NOT NULL,
	"language" text NOT NULL,
	"title" text NOT NULL,
	CONSTRAINT "recipe_translations_recipe_id_language_pk" PRIMARY KEY("recipe_id","language")
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "content_source" NOT NULL,
	"category_id" uuid,
	"cuisine_id" uuid,
	"photo_url" text,
	"cook_time_minutes" integer,
	"servings" integer DEFAULT 1 NOT NULL,
	"total_weight_g" numeric(8, 2),
	"calories" integer NOT NULL,
	"protein_g" numeric(7, 2) NOT NULL,
	"fats_g" numeric(7, 2) NOT NULL,
	"carbs_g" numeric(7, 2) NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"amount_g" numeric(8, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_step_translations" (
	"step_id" uuid NOT NULL,
	"language" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	CONSTRAINT "recipe_step_translations_step_id_language_pk" PRIMARY KEY("step_id","language")
);
--> statement-breakpoint
CREATE TABLE "recipe_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"step_number" integer NOT NULL,
	"duration_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_steps_recipe_number_key" UNIQUE("recipe_id","step_number")
);
--> statement-breakpoint
CREATE TABLE "recipe_diets" (
	"recipe_id" uuid NOT NULL,
	"diet_id" uuid NOT NULL,
	CONSTRAINT "recipe_diets_recipe_id_diet_id_pk" PRIMARY KEY("recipe_id","diet_id")
);
--> statement-breakpoint
CREATE TABLE "recipe_favorites" (
	"user_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_favorites_user_id_recipe_id_pk" PRIMARY KEY("user_id","recipe_id")
);
--> statement-breakpoint
ALTER TABLE "dish_category_translations" ADD CONSTRAINT "dish_category_translations_category_id_dish_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."dish_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cuisine_translations" ADD CONSTRAINT "cuisine_translations_cuisine_id_cuisines_id_fk" FOREIGN KEY ("cuisine_id") REFERENCES "public"."cuisines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_translations" ADD CONSTRAINT "diet_translations_diet_id_diets_id_fk" FOREIGN KEY ("diet_id") REFERENCES "public"."diets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_group_translations" ADD CONSTRAINT "product_group_translations_group_id_product_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."product_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_group_id_product_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."product_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_translations" ADD CONSTRAINT "recipe_translations_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_category_id_dish_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."dish_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_cuisine_id_cuisines_id_fk" FOREIGN KEY ("cuisine_id") REFERENCES "public"."cuisines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_step_translations" ADD CONSTRAINT "recipe_step_translations_step_id_recipe_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."recipe_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_diets" ADD CONSTRAINT "recipe_diets_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_diets" ADD CONSTRAINT "recipe_diets_diet_id_diets_id_fk" FOREIGN KEY ("diet_id") REFERENCES "public"."diets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_favorites" ADD CONSTRAINT "recipe_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_favorites" ADD CONSTRAINT "recipe_favorites_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_translations_language_idx" ON "product_translations" USING btree ("language");--> statement-breakpoint
CREATE INDEX "products_source_creator_idx" ON "products" USING btree ("source","created_by");--> statement-breakpoint
CREATE INDEX "recipe_translations_language_idx" ON "recipe_translations" USING btree ("language");--> statement-breakpoint
CREATE INDEX "recipes_source_creator_idx" ON "recipes" USING btree ("source","created_by");--> statement-breakpoint
CREATE INDEX "recipes_category_idx" ON "recipes" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "recipes_cuisine_idx" ON "recipes" USING btree ("cuisine_id");--> statement-breakpoint
CREATE INDEX "recipe_ingredients_recipe_idx" ON "recipe_ingredients" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_ingredients_product_idx" ON "recipe_ingredients" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "recipe_diets_diet_idx" ON "recipe_diets" USING btree ("diet_id");
--> statement-breakpoint
INSERT INTO "dish_categories" ("slug", "emoji", "sort_order") VALUES
	('salty-breakfast', '🥓', 1),
	('sweet-breakfast', '🍩', 2),
	('lunch', '🍲', 3),
	('dinner', '🍽️', 4),
	('snacks', '🍿', 5),
	('salads', '🥗', 6),
	('pasta', '🍝', 7),
	('bowls', '🥣', 8),
	('smoothies', '🍹', 9),
	('desserts', '🍰', 10),
	('baking', '🥐', 11);--> statement-breakpoint
INSERT INTO "dish_category_translations" ("category_id", "language", "name")
SELECT c."id", v."language", v."name"
FROM "dish_categories" c
JOIN (VALUES
	('salty-breakfast', 'uk', 'Солоні сніданки'), ('salty-breakfast', 'en', 'Savoury breakfasts'),
	('sweet-breakfast', 'uk', 'Солодкі сніданки'), ('sweet-breakfast', 'en', 'Sweet breakfasts'),
	('lunch', 'uk', 'Обіди'), ('lunch', 'en', 'Lunches'),
	('dinner', 'uk', 'Вечері'), ('dinner', 'en', 'Dinners'),
	('snacks', 'uk', 'Перекуси'), ('snacks', 'en', 'Snacks'),
	('salads', 'uk', 'Салати'), ('salads', 'en', 'Salads'),
	('pasta', 'uk', 'Пасти'), ('pasta', 'en', 'Pasta'),
	('bowls', 'uk', 'Боули'), ('bowls', 'en', 'Bowls'),
	('smoothies', 'uk', 'Смузі'), ('smoothies', 'en', 'Smoothies'),
	('desserts', 'uk', 'Десерти'), ('desserts', 'en', 'Desserts'),
	('baking', 'uk', 'Випічка'), ('baking', 'en', 'Baking')
) AS v("slug", "language", "name") ON v."slug" = c."slug";--> statement-breakpoint
INSERT INTO "product_groups" ("slug", "emoji", "sort_order") VALUES
	('vegetables', '🥦', 1),
	('fruits', '🍓', 2),
	('meat', '🥩', 3),
	('fish', '🐟', 4),
	('sweets', '🍬', 5),
	('dairy', '🥛', 6);--> statement-breakpoint
INSERT INTO "product_group_translations" ("group_id", "language", "name")
SELECT g."id", v."language", v."name"
FROM "product_groups" g
JOIN (VALUES
	('vegetables', 'uk', 'Овочі'), ('vegetables', 'en', 'Vegetables'),
	('fruits', 'uk', 'Фрукти'), ('fruits', 'en', 'Fruits'),
	('meat', 'uk', 'М''ясо'), ('meat', 'en', 'Meat'),
	('fish', 'uk', 'Риба'), ('fish', 'en', 'Fish'),
	('sweets', 'uk', 'Солодке'), ('sweets', 'en', 'Sweets'),
	('dairy', 'uk', 'Молочне'), ('dairy', 'en', 'Dairy')
) AS v("slug", "language", "name") ON v."slug" = g."slug";--> statement-breakpoint
INSERT INTO "cuisines" ("slug", "emoji", "sort_order") VALUES
	('georgian', '🇬🇪', 1),
	('italian', '🇮🇹', 2),
	('greek', '🇬🇷', 3),
	('mexican', '🇲🇽', 4),
	('asian', '🌏', 5),
	('ukrainian', '🇺🇦', 6);--> statement-breakpoint
INSERT INTO "cuisine_translations" ("cuisine_id", "language", "name")
SELECT c."id", v."language", v."name"
FROM "cuisines" c
JOIN (VALUES
	('georgian', 'uk', 'Грузинська'), ('georgian', 'en', 'Georgian'),
	('italian', 'uk', 'Італійська'), ('italian', 'en', 'Italian'),
	('greek', 'uk', 'Грецька'), ('greek', 'en', 'Greek'),
	('mexican', 'uk', 'Мексиканська'), ('mexican', 'en', 'Mexican'),
	('asian', 'uk', 'Азійська'), ('asian', 'en', 'Asian'),
	('ukrainian', 'uk', 'Українська'), ('ukrainian', 'en', 'Ukrainian')
) AS v("slug", "language", "name") ON v."slug" = c."slug";--> statement-breakpoint
INSERT INTO "diets" ("slug", "emoji", "sort_order") VALUES
	('vegetarian', '🌿', 1),
	('vegan', '🌱', 2),
	('low-carb', '🥦', 3),
	('low-fat', '🫀', 4),
	('low-calorie', '🥬', 5),
	('high-protein', '💪', 6),
	('high-fiber', '🌾', 7),
	('keto', '🥑', 8),
	('pescatarian', '🐟', 9),
	('sugar-free', '🍭', 10),
	('lactose-free', '🥛', 11),
	('gluten-free', '🌾', 12),
	('detox', '🌿', 13);--> statement-breakpoint
INSERT INTO "diet_translations" ("diet_id", "language", "name")
SELECT d."id", v."language", v."name"
FROM "diets" d
JOIN (VALUES
	('vegetarian', 'uk', 'Вегетаріанська'), ('vegetarian', 'en', 'Vegetarian'),
	('vegan', 'uk', 'Веганська'), ('vegan', 'en', 'Vegan'),
	('low-carb', 'uk', 'Низьковуглеводна'), ('low-carb', 'en', 'Low-carb'),
	('low-fat', 'uk', 'Знежирена'), ('low-fat', 'en', 'Low-fat'),
	('low-calorie', 'uk', 'Низькокалорійна'), ('low-calorie', 'en', 'Low-calorie'),
	('high-protein', 'uk', 'Високобілкова'), ('high-protein', 'en', 'High-protein'),
	('high-fiber', 'uk', 'Багато клітковини'), ('high-fiber', 'en', 'High-fibre'),
	('keto', 'uk', 'Кетогенна'), ('keto', 'en', 'Keto'),
	('pescatarian', 'uk', 'Пескетаріанська'), ('pescatarian', 'en', 'Pescatarian'),
	('sugar-free', 'uk', 'Без цукру'), ('sugar-free', 'en', 'Sugar-free'),
	('lactose-free', 'uk', 'Без лактози'), ('lactose-free', 'en', 'Lactose-free'),
	('gluten-free', 'uk', 'Без глютену'), ('gluten-free', 'en', 'Gluten-free'),
	('detox', 'uk', 'Детокс'), ('detox', 'en', 'Detox')
) AS v("slug", "language", "name") ON v."slug" = d."slug";
--> statement-breakpoint
WITH p AS (INSERT INTO "products" ("source", "group_id", "calories_per_100g", "protein_per_100g", "fats_per_100g", "carbs_per_100g", "serving_weight_g", "is_quick_pick", "is_verified") SELECT 'global', g."id", 23, 2.9, 0.4, 3.6, NULL, true, true FROM "product_groups" g WHERE g."slug" = 'vegetables' RETURNING "id")
INSERT INTO "product_translations" ("product_id", "language", "name", "serving_label") SELECT p."id", t."language", t."name", t."serving_label" FROM p, (VALUES ('uk', 'Шпинат', NULL), ('en', 'Spinach', NULL)) AS t("language", "name", "serving_label");--> statement-breakpoint
WITH p AS (INSERT INTO "products" ("source", "group_id", "calories_per_100g", "protein_per_100g", "fats_per_100g", "carbs_per_100g", "serving_weight_g", "is_quick_pick", "is_verified") SELECT 'global', g."id", 127, 8.7, 0.5, 22.8, NULL, true, true FROM "product_groups" g WHERE g."slug" = 'vegetables' RETURNING "id")
INSERT INTO "product_translations" ("product_id", "language", "name", "serving_label") SELECT p."id", t."language", t."name", t."serving_label" FROM p, (VALUES ('uk', 'Квасоля', NULL), ('en', 'Beans', NULL)) AS t("language", "name", "serving_label");--> statement-breakpoint
WITH p AS (INSERT INTO "products" ("source", "group_id", "calories_per_100g", "protein_per_100g", "fats_per_100g", "carbs_per_100g", "serving_weight_g", "is_quick_pick", "is_verified") SELECT 'global', g."id", 18, 0.9, 0.2, 3.9, 123, true, true FROM "product_groups" g WHERE g."slug" = 'vegetables' RETURNING "id")
INSERT INTO "product_translations" ("product_id", "language", "name", "serving_label") SELECT p."id", t."language", t."name", t."serving_label" FROM p, (VALUES ('uk', 'Помідори', '1 шт'), ('en', 'Tomatoes', '1 medium')) AS t("language", "name", "serving_label");--> statement-breakpoint
WITH p AS (INSERT INTO "products" ("source", "group_id", "calories_per_100g", "protein_per_100g", "fats_per_100g", "carbs_per_100g", "serving_weight_g", "is_quick_pick", "is_verified") SELECT 'global', g."id", 43, 1.6, 0.2, 9.6, 82, true, true FROM "product_groups" g WHERE g."slug" = 'vegetables' RETURNING "id")
INSERT INTO "product_translations" ("product_id", "language", "name", "serving_label") SELECT p."id", t."language", t."name", t."serving_label" FROM p, (VALUES ('uk', 'Буряк', '1 шт'), ('en', 'Beetroot', '1 beet')) AS t("language", "name", "serving_label");--> statement-breakpoint
WITH p AS (INSERT INTO "products" ("source", "group_id", "calories_per_100g", "protein_per_100g", "fats_per_100g", "carbs_per_100g", "serving_weight_g", "is_quick_pick", "is_verified") SELECT 'global', g."id", 25, 1.3, 0.1, 5.8, NULL, true, true FROM "product_groups" g WHERE g."slug" = 'vegetables' RETURNING "id")
INSERT INTO "product_translations" ("product_id", "language", "name", "serving_label") SELECT p."id", t."language", t."name", t."serving_label" FROM p, (VALUES ('uk', 'Капуста', NULL), ('en', 'Cabbage', NULL)) AS t("language", "name", "serving_label");--> statement-breakpoint
WITH p AS (INSERT INTO "products" ("source", "group_id", "calories_per_100g", "protein_per_100g", "fats_per_100g", "carbs_per_100g", "serving_weight_g", "is_quick_pick", "is_verified") SELECT 'global', g."id", 41, 0.9, 0.2, 9.6, 61, true, true FROM "product_groups" g WHERE g."slug" = 'vegetables' RETURNING "id")
INSERT INTO "product_translations" ("product_id", "language", "name", "serving_label") SELECT p."id", t."language", t."name", t."serving_label" FROM p, (VALUES ('uk', 'Морква', '1 шт'), ('en', 'Carrot', '1 medium')) AS t("language", "name", "serving_label");--> statement-breakpoint
WITH p AS (INSERT INTO "products" ("source", "group_id", "calories_per_100g", "protein_per_100g", "fats_per_100g", "carbs_per_100g", "serving_weight_g", "is_quick_pick", "is_verified") SELECT 'global', g."id", 40, 1.1, 0.1, 9.3, 110, true, true FROM "product_groups" g WHERE g."slug" = 'vegetables' RETURNING "id")
INSERT INTO "product_translations" ("product_id", "language", "name", "serving_label") SELECT p."id", t."language", t."name", t."serving_label" FROM p, (VALUES ('uk', 'Цибуля', '1 шт'), ('en', 'Onion', '1 medium')) AS t("language", "name", "serving_label");--> statement-breakpoint
WITH p AS (INSERT INTO "products" ("source", "group_id", "calories_per_100g", "protein_per_100g", "fats_per_100g", "carbs_per_100g", "serving_weight_g", "is_quick_pick", "is_verified") SELECT 'global', g."id", 31, 1.0, 0.3, 6.0, 119, true, true FROM "product_groups" g WHERE g."slug" = 'vegetables' RETURNING "id")
INSERT INTO "product_translations" ("product_id", "language", "name", "serving_label") SELECT p."id", t."language", t."name", t."serving_label" FROM p, (VALUES ('uk', 'Перець', '1 шт'), ('en', 'Bell pepper', '1 medium')) AS t("language", "name", "serving_label");--> statement-breakpoint
WITH p AS (INSERT INTO "products" ("source", "group_id", "calories_per_100g", "protein_per_100g", "fats_per_100g", "carbs_per_100g", "serving_weight_g", "is_quick_pick", "is_verified") SELECT 'global', g."id", 86, 3.3, 1.4, 19.0, NULL, true, true FROM "product_groups" g WHERE g."slug" = 'vegetables' RETURNING "id")
INSERT INTO "product_translations" ("product_id", "language", "name", "serving_label") SELECT p."id", t."language", t."name", t."serving_label" FROM p, (VALUES ('uk', 'Кукурудза', NULL), ('en', 'Sweetcorn', NULL)) AS t("language", "name", "serving_label");--> statement-breakpoint
WITH p AS (INSERT INTO "products" ("source", "group_id", "calories_per_100g", "protein_per_100g", "fats_per_100g", "carbs_per_100g", "serving_weight_g", "is_quick_pick", "is_verified") SELECT 'global', g."id", 16, 0.7, 0.1, 3.4, 4.5, true, true FROM "product_groups" g WHERE g."slug" = 'vegetables' RETURNING "id")
INSERT INTO "product_translations" ("product_id", "language", "name", "serving_label") SELECT p."id", t."language", t."name", t."serving_label" FROM p, (VALUES ('uk', 'Редис', '1 шт'), ('en', 'Radish', '1 radish')) AS t("language", "name", "serving_label");--> statement-breakpoint
WITH p AS (INSERT INTO "products" ("source", "group_id", "calories_per_100g", "protein_per_100g", "fats_per_100g", "carbs_per_100g", "serving_weight_g", "is_quick_pick", "is_verified") SELECT 'global', g."id", 15, 0.7, 0.1, 3.6, 201, true, true FROM "product_groups" g WHERE g."slug" = 'vegetables' RETURNING "id")
INSERT INTO "product_translations" ("product_id", "language", "name", "serving_label") SELECT p."id", t."language", t."name", t."serving_label" FROM p, (VALUES ('uk', 'Огірки', '1 шт'), ('en', 'Cucumber', '1 medium')) AS t("language", "name", "serving_label");--> statement-breakpoint
WITH p AS (INSERT INTO "products" ("source", "group_id", "calories_per_100g", "protein_per_100g", "fats_per_100g", "carbs_per_100g", "serving_weight_g", "is_quick_pick", "is_verified") SELECT 'global', g."id", 16, 0.7, 0.2, 3.0, NULL, true, true FROM "product_groups" g WHERE g."slug" = 'vegetables' RETURNING "id")
INSERT INTO "product_translations" ("product_id", "language", "name", "serving_label") SELECT p."id", t."language", t."name", t."serving_label" FROM p, (VALUES ('uk', 'Селера', NULL), ('en', 'Celery', NULL)) AS t("language", "name", "serving_label");--> statement-breakpoint
WITH p AS (INSERT INTO "products" ("source", "group_id", "calories_per_100g", "protein_per_100g", "fats_per_100g", "carbs_per_100g", "serving_weight_g", "is_quick_pick", "is_verified") SELECT 'global', g."id", 149, 6.4, 0.5, 33.1, 3, true, true FROM "product_groups" g WHERE g."slug" = 'vegetables' RETURNING "id")
INSERT INTO "product_translations" ("product_id", "language", "name", "serving_label") SELECT p."id", t."language", t."name", t."serving_label" FROM p, (VALUES ('uk', 'Часник', '1 зубчик'), ('en', 'Garlic', '1 clove')) AS t("language", "name", "serving_label");--> statement-breakpoint
WITH p AS (INSERT INTO "products" ("source", "group_id", "calories_per_100g", "protein_per_100g", "fats_per_100g", "carbs_per_100g", "serving_weight_g", "is_quick_pick", "is_verified") SELECT 'global', g."id", 36, 3.0, 0.8, 6.3, NULL, true, true FROM "product_groups" g WHERE g."slug" = 'vegetables' RETURNING "id")
INSERT INTO "product_translations" ("product_id", "language", "name", "serving_label") SELECT p."id", t."language", t."name", t."serving_label" FROM p, (VALUES ('uk', 'Петрушка', NULL), ('en', 'Parsley', NULL)) AS t("language", "name", "serving_label");--> statement-breakpoint
WITH p AS (INSERT INTO "products" ("source", "group_id", "calories_per_100g", "protein_per_100g", "fats_per_100g", "carbs_per_100g", "serving_weight_g", "is_quick_pick", "is_verified") SELECT 'global', g."id", 17, 1.2, 0.3, 3.1, 196, true, true FROM "product_groups" g WHERE g."slug" = 'vegetables' RETURNING "id")
INSERT INTO "product_translations" ("product_id", "language", "name", "serving_label") SELECT p."id", t."language", t."name", t."serving_label" FROM p, (VALUES ('uk', 'Кабачки', '1 шт'), ('en', 'Zucchini', '1 medium')) AS t("language", "name", "serving_label");
