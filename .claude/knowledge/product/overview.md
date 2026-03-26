# Product Domain

Продукти — це база харчових інгредієнтів з нутриціологічними даними на 100г та мультимовними назвами.

## DB Tables

### `products`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | gen_random_uuid() |
| type | product_type enum | `'global'` (seed data) or `'custom'` (user-created) |
| calories_per_100g | numeric | default 0 |
| proteins_per_100g | numeric | default 0 |
| carbs_per_100g | numeric | default 0 |
| fats_per_100g | numeric | default 0 |
| is_verified | boolean | default false, admin can verify |
| created_by | uuid (nullable) | FK → auth.users, null for seed data |
| created_at | timestamptz | default now() |

### `product_translations`
| Column | Type | Description |
|--------|------|-------------|
| product_id | uuid (PK) | FK → products.id |
| language | text (PK) | FK → languages.code |
| name | text | Product name in that language |

Composite PK: `(product_id, language)`.

## Languages

Supported 20 languages (table `languages`):
`ar, de, en, es, fr, he, hi, id, it, ja, ko, nl, pl, pt-BR, ru, th, tr, uk, vi, zh-Hans`

## Seed Data

272 global verified products seeded from USDA data, each with 20 translations.
Categories: meats, fish, seafood, grains, pasta, bread, flour, vegetables (30+), fruits (25+), nuts & seeds, legumes, dairy & cheeses, eggs, plant milks, oils, sauces & condiments, spices & herbs, dried fruits, sweeteners, superfoods, canned goods.

## Product Types

- **global** — pre-seeded products, verified, visible to all users in search (if translation for user's language exists)
- **custom** — user-created products, only have translation in user's language, not verified by default

## Calorie Calculation

`calories = proteins * 4 + carbs * 4 + fats * 9`

## Search Behavior

Search uses `INNER JOIN` on `product_translations` filtered by user's language + `ILIKE` on name. This means:
- Global products with all 20 translations → always found regardless of user language
- Custom products with only 1 translation → found only by users with that language

## API Endpoints

### Admin (web panel)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/products` | List all (paginated, search, filter by type) |
| GET | `/api/admin/products/:id` | Get product with all translations |
| PUT | `/api/admin/products/:id` | Update nutrition + all translations |
| PATCH | `/api/admin/products/:id/verify` | Toggle verified status |

### Client (mobile)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products/search?q=...` | Search by name in user's language |
| POST | `/api/products/custom` | Create custom product |

## API Flow

### Admin: Update Product
```
PUT /api/admin/products/:id
Body: {
  calories_per_100g: number,
  proteins_per_100g: number,
  carbs_per_100g: number,
  fats_per_100g: number,
  translations: [{ language: string, name: string }, ...]
}
```
Controller → ProductService.update() → upserts products row + upserts each translation row (ON CONFLICT product_id,language).

### Client: Create Custom Product
```
POST /api/products/custom
Body: { name, proteins_per_100g, carbs_per_100g, fats_per_100g, calories_per_100g? }
```
Calories auto-calculated if not provided. Creates `custom` product + single translation in user's language.

## Code Structure

### Backend (API)
```
apps/api/src/
├── shared/services/product.service.ts    # Business logic (search, getAll, getById, createCustom, update, verify)
├── admin/products/
│   ├── product.controller.ts             # Admin handlers
│   ├── product.routes.ts                 # GET /, GET /:id, PUT /:id, PATCH /:id/verify
│   └── index.ts
├── client/products/
│   ├── product.controller.ts             # Client handlers (search, createCustom)
│   ├── product.routes.ts                 # GET /search, POST /custom
│   └── index.ts
```

### Frontend — Web (admin panel)
```
apps/web/src/
├── data/remote/domains/product/
│   ├── product.api.ts                    # ProductApi: getAll, getById, update, verify
│   ├── product.types.ts                  # Product, ProductDetail, UpdateProductParams, etc.
│   └── index.ts
├── state/domains/product/hooks/
│   ├── useGetProducts.ts                 # List with filters
│   ├── useGetProduct.ts                  # Single product detail
│   ├── useUpdateProduct.ts              # Mutation: update nutrition + translations
│   ├── useVerifyProduct.ts              # Mutation: toggle verified
│   └── index.ts
├── view/product/products-list/
│   ├── ProductsPage.tsx                  # Table with search, type filter, pagination
│   ├── useProductsPage.ts               # Page logic
│   └── components/
│       └── ProductDetailPanel.tsx        # Sheet with view mode + edit mode
├── app/(dashboard)/products/page.tsx     # Next.js route
```

### Admin Panel UI

**ProductsPage** — table with columns: Name, Type, Calories, Protein, Carbs, Fats, Verified. Click row → opens Sheet.

**ProductDetailPanel** — two modes:
1. **View mode** — shows badges (type, verified), nutrition cards, translations list, Edit button, Verify button (for custom only)
2. **Edit mode** — editable number inputs for КБЖВ, editable text input for each of 20 translation names, Save/Cancel buttons
