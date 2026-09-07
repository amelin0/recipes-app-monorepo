CREATE TABLE "recipe_step_ingredients" (
	"step_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	CONSTRAINT "recipe_step_ingredients_step_id_ingredient_id_pk" PRIMARY KEY("step_id","ingredient_id")
);
--> statement-breakpoint
ALTER TABLE "recipe_step_ingredients" ADD CONSTRAINT "recipe_step_ingredients_step_id_recipe_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."recipe_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_step_ingredients" ADD CONSTRAINT "recipe_step_ingredients_ingredient_id_recipe_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."recipe_ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recipe_step_ingredients_ingredient_idx" ON "recipe_step_ingredients" USING btree ("ingredient_id");