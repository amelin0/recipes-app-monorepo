# Recipe CSV Import Format

## Endpoint
`POST /admin/recipes/import` (multipart/form-data, field: `file`)

## CSV Columns

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `recipe_key` | string | Yes | Groups translations of the same recipe |
| `language` | string | Yes | Language code (en, uk, es, fr, de, etc.) |
| `title` | string | Yes | Recipe name in this language |
| `cooking_instructions` | string | No | Steps separated by `\|` |
| `calories` | number | Yes | Same for all rows of one recipe_key |
| `proteins_g` | number | Yes | Same for all rows |
| `carbs_g` | number | Yes | Same for all rows |
| `fats_g` | number | Yes | Same for all rows |
| `servings` | number | No | Default: 1 |
| `cooking_time_minutes` | number | No | Default: 0 |
| `ingredients` | string | No | Format: `name:amount:unit;name:amount:unit` |
| `tags` | string | No | Format: `tag1;tag2;tag3` |

## Separators

- `|` — separates cooking instruction steps
- `;` — separates ingredients or tags
- `:` — separates ingredient fields (name:amount:unit)

## Units

Available: `g`, `ml`, `tsp`, `tbsp`, `cup`, `pcs`

## Rules

1. **recipe_key** groups all language rows for one recipe. Must be unique per recipe, consistent across rows.
2. **Numeric data** (calories, proteins, etc.) is taken from the first row of each recipe_key group.
3. **Ingredients** must be in the same order across all language rows (index-based matching).
4. **Tags** must be in the same order across all language rows.
5. If an ingredient/tag name is not found in the DB, it's created with translations from all CSV rows.

## Example

```csv
recipe_key,language,title,cooking_instructions,calories,proteins_g,carbs_g,fats_g,servings,cooking_time_minutes,ingredients,tags
baked-salmon,en,"Baked Salmon with Quinoa","Preheat oven to 200°C|Season salmon with salt and pepper|Bake for 15 minutes|Cook quinoa separately",550,45,35,18,2,30,"salmon fillet:200:g;quinoa:100:g;olive oil:1:tbsp;lemon:1:pcs","health;dinner;keto"
baked-salmon,uk,"Запечений лосось з кіноа","Розігрійте духовку до 200°C|Посоліть та поперчіть лосось|Запікайте 15 хвилин|Зваріть кіноа окремо",550,45,35,18,2,30,"філе лосося:200:g;кіноа:100:g;оливкова олія:1:tbsp;лимон:1:pcs","здоров'я;вечеря;кето"
baked-salmon,es,"Salmón al horno con quinoa","Precalentar el horno a 200°C|Sazonar el salmón con sal y pimienta|Hornear durante 15 minutos|Cocinar la quinoa por separado",550,45,35,18,2,30,"filete de salmón:200:g;quinoa:100:g;aceite de oliva:1:tbsp;limón:1:pcs","salud;cena;keto"
avocado-toast,en,"Avocado Toast with Poached Egg","Toast bread|Mash avocado with fork|Spread on toast|Top with poached egg",320,15,28,18,1,10,"wholegrain bread:80:g;avocado:100:g;egg:1:pcs;salt:1:tsp","breakfast;vegetarian;health"
avocado-toast,uk,"Тост з авокадо та яйцем пашот","Підсмажте хліб|Розімніть авокадо виделкою|Намажте на тост|Покладіть яйце пашот зверху",320,15,28,18,1,10,"цільнозерновий хліб:80:g;авокадо:100:g;яйце:1:pcs;сіль:1:tsp","сніданок;вегетаріанське;здоров'я"
avocado-toast,es,"Tostada de aguacate con huevo pochado","Tostar el pan|Aplastar el aguacate con un tenedor|Untar en la tostada|Poner el huevo pochado encima",320,15,28,18,1,10,"pan integral:80:g;aguacate:100:g;huevo:1:pcs;sal:1:tsp","desayuno;vegetariano;salud"
```

## Response

```json
{
  "success": true,
  "data": {
    "imported": 2,
    "errors": []
  }
}
```
