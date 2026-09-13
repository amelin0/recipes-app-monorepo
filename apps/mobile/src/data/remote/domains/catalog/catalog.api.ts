import { HttpService } from '@/shared/services';

import type {
    CreateProductPayload,
    CreateRecipePayload,
    Paginated,
    Product,
    ProductListQuery,
    RecipeCard,
    RecipeDetail,
    RecipeFilters,
    RecipeListQuery,
} from './catalog.types';

const ENDPOINTS = {
    products: '/products',
    recipes: '/recipes',
    recipeFilters: '/recipes/filters',
    recipe: (id: string) => `/recipes/${id}`,
    favorite: (id: string) => `/recipes/${id}/favorite`,
} as const;

/**
 * Array filters go over the wire as repeated keys (`?diets=a&diets=b`), which
 * is what `qs`-style parsing on the server expects. axios' default serializer
 * would append `[]` to each key and the server would see no filter at all.
 */
const toSearchParams = (query: object): URLSearchParams => {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
            value.forEach(item => params.append(key, String(item)));
            return;
        }
        params.append(key, String(value));
    });

    return params;
};

export const CatalogApi = {
    getProducts: (query: ProductListQuery = {}) =>
        HttpService.get<Paginated<Product>>(ENDPOINTS.products, { params: toSearchParams(query) }),

    /** A product the user adds by hand; it lands in their own catalogue only. */
    createProduct: (payload: CreateProductPayload) => HttpService.post<Product>(ENDPOINTS.products, payload),

    getRecipes: (query: RecipeListQuery = {}) =>
        HttpService.get<Paginated<RecipeCard>>(ENDPOINTS.recipes, { params: toSearchParams(query) }),

    /** Everything the filter sheet needs, in one read. */
    getRecipeFilters: () => HttpService.get<RecipeFilters>(ENDPOINTS.recipeFilters),

    getRecipe: (id: string) => HttpService.get<RecipeDetail>(ENDPOINTS.recipe(id)),

    createRecipe: (payload: CreateRecipePayload) => HttpService.post<RecipeDetail>(ENDPOINTS.recipes, payload),

    /** Only a dish the user made; 403 on a catalogue recipe. */
    deleteRecipe: (id: string) => HttpService.delete<void>(ENDPOINTS.recipe(id)),

    addFavorite: (id: string) => HttpService.put<void>(ENDPOINTS.favorite(id)),

    removeFavorite: (id: string) => HttpService.delete<void>(ENDPOINTS.favorite(id)),
};
