# Claude AI Prompt for Generating Recipe CSV

Use this prompt with Claude to generate a properly formatted CSV file with recipe translations for all supported languages.

## Prompt Template

```
I need you to generate a CSV file with recipes translated into all supported languages.

## Languages (20 total):
Tier 1: en (English), es (Spanish), pt-BR (Portuguese), fr (French), de (German), ja (Japanese), ko (Korean), zh-Hans (Chinese Simplified), ar (Arabic)
Tier 2: hi (Hindi), tr (Turkish), it (Italian), nl (Dutch), pl (Polish), id (Indonesian), th (Thai), vi (Vietnamese), he (Hebrew), uk (Ukrainian), ru (Russian)

## CSV Format:
recipe_key,language,title,cooking_instructions,calories,proteins_g,carbs_g,fats_g,servings,cooking_time_minutes,ingredients,tags

## Rules:
1. recipe_key: kebab-case identifier grouping all language rows for one recipe
2. cooking_instructions: steps separated by | (pipe)
3. ingredients: name:amount:unit separated by ; (semicolon). Units: g, ml, tsp, tbsp, cup, pcs
4. tags: tag names separated by ; (semicolon)
5. Numeric values (calories, proteins_g, carbs_g, fats_g, servings, cooking_time_minutes) are the SAME for all language rows of one recipe
6. Ingredients must be in the SAME ORDER across all languages (they are matched by index)
7. Tags must be in the SAME ORDER across all languages
8. All text fields should be properly quoted if they contain commas
9. Translations must be accurate and natural — not machine-translated feel
10. Recipe names should be culturally appropriate (e.g., "Borscht" in English, "Борщ" in Ukrainian)
11. Ingredient names should use local naming conventions (e.g., "eggplant" in US English, "aubergine" in British English — use US English)

## Recipes to generate:
[LIST YOUR RECIPES HERE, e.g.:]
1. Baked salmon with quinoa and avocado
2. Greek salad
3. Chicken tikka masala
4. Japanese miso soup
5. Italian margherita pizza

## Important:
- Each recipe needs ONE row per language (20 rows per recipe)
- Nutritional data should be realistic
- Cooking instructions should be detailed (4-8 steps)
- Include 3-8 ingredients per recipe
- Include 2-4 tags per recipe from: health, vegetarian, vegan, keto, breakfast, lunch, dinner, snack, dessert, high-protein, low-carb, gluten-free, dairy-free, quick (under 30 min)

Generate the complete CSV with all recipes and all 20 language translations.
```

## Usage Notes

1. For large batches (50+ recipes), split into multiple prompts of 10-20 recipes each
2. Review the output for accuracy — especially for less common languages (Thai, Vietnamese, Arabic)
3. Check ingredient order consistency across languages
4. Verify nutritional values are realistic
5. The generated CSV can be directly imported via `POST /admin/recipes/import`

## Example Output (3 languages, 1 recipe)

```csv
recipe_key,language,title,cooking_instructions,calories,proteins_g,carbs_g,fats_g,servings,cooking_time_minutes,ingredients,tags
greek-salad,en,"Greek Salad","Chop tomatoes, cucumber, and bell pepper|Slice red onion thinly|Add kalamata olives and feta cheese|Drizzle with olive oil and oregano|Toss gently and serve",280,12,15,20,2,15,"tomatoes:200:g;cucumber:150:g;red onion:50:g;feta cheese:100:g;kalamata olives:50:g;olive oil:2:tbsp;bell pepper:100:g","health;vegetarian;lunch;quick"
greek-salad,uk,"Грецький салат","Наріжте помідори, огірок та перець|Нарізайте цибулю тонкими кільцями|Додайте оливки каламата та сир фета|Полийте оливковою олією та посипте орегано|Обережно перемішайте і подавайте",280,12,15,20,2,15,"помідори:200:g;огірок:150:g;червона цибуля:50:g;сир фета:100:g;оливки каламата:50:g;оливкова олія:2:tbsp;перець болгарський:100:g","здоров'я;вегетаріанське;обід;швидке"
greek-salad,ja,"グリークサラダ","トマト、きゅうり、ピーマンを切る|赤玉ねぎを薄くスライスする|カラマタオリーブとフェタチーズを加える|オリーブオイルとオレガノをかける|軽く混ぜて盛り付ける",280,12,15,20,2,15,"トマト:200:g;きゅうり:150:g;赤玉ねぎ:50:g;フェタチーズ:100:g;カラマタオリーブ:50:g;オリーブオイル:2:tbsp;ピーマン:100:g","ヘルシー;ベジタリアン;ランチ;時短"
```
