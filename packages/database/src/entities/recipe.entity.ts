import { ContentSource } from '@dns/shared-types';

import { recipeIngredients, recipeSteps, recipes } from '../schema';

import { ReferenceEntity } from './catalog-reference.entity';

type RecipeRow = typeof recipes.$inferSelect;
type RecipeIngredientRow = typeof recipeIngredients.$inferSelect;
type RecipeStepRow = typeof recipeSteps.$inferSelect;

export interface RecipeRowWithTitle extends RecipeRow {
    title: string;
    isFavorite: boolean;
    category?: ReferenceEntity | null;
    cuisine?: ReferenceEntity | null;
    diets?: ReferenceEntity[];
}

/**
 * A dish as the catalogue and the detail screen read it.
 *
 * Stored figures cover the whole dish; the per-serving ones are derived here
 * so the card, the calorie filter and the portion sheet cannot each divide
 * differently.
 */
export class RecipeEntity {
    readonly id: string;
    readonly source: ContentSource;
    readonly title: string;
    readonly photoUrl: string | null;
    readonly cookTimeMinutes: number | null;
    readonly servings: number;
    readonly totalWeightG: number | null;
    readonly calories: number;
    readonly proteinG: number;
    readonly fatsG: number;
    readonly carbsG: number;
    readonly isFavorite: boolean;
    readonly category: ReferenceEntity | null;
    readonly cuisine: ReferenceEntity | null;
    readonly diets: ReferenceEntity[];
    readonly createdBy: string | null;

    /** Per serving — what every screen showing «N ккал» on a card means. */
    readonly caloriesPerServing: number;
    readonly proteinPerServingG: number;
    readonly fatsPerServingG: number;
    readonly carbsPerServingG: number;
    readonly servingWeightG: number | null;

    private constructor(row: RecipeRowWithTitle) {
        this.id = row.id;
        this.source = row.source as ContentSource;
        this.title = row.title;
        this.photoUrl = row.photoUrl;
        this.cookTimeMinutes = row.cookTimeMinutes;
        this.servings = row.servings;
        this.totalWeightG = row.totalWeightG === null ? null : Number(row.totalWeightG);
        this.calories = row.calories;
        this.proteinG = Number(row.proteinG);
        this.fatsG = Number(row.fatsG);
        this.carbsG = Number(row.carbsG);
        this.isFavorite = row.isFavorite;
        this.category = row.category ?? null;
        this.cuisine = row.cuisine ?? null;
        this.diets = row.diets ?? [];
        this.createdBy = row.createdBy;

        // `servings` is NOT NULL with a default of 1, so this never divides by
        // zero — but a recipe imported with an explicit 0 would, and a silent
        // Infinity on a calorie count is worse than treating it as one serving.
        const servings = row.servings > 0 ? row.servings : 1;
        this.caloriesPerServing = round(this.calories / servings);
        this.proteinPerServingG = round(this.proteinG / servings);
        this.fatsPerServingG = round(this.fatsG / servings);
        this.carbsPerServingG = round(this.carbsG / servings);
        this.servingWeightG = this.totalWeightG === null ? null : round(this.totalWeightG / servings);
    }

    static from(row: RecipeRowWithTitle): RecipeEntity {
        return new RecipeEntity(row);
    }
}

export interface RecipeIngredientRowWithProduct extends RecipeIngredientRow {
    name: string;
    caloriesPer100g: string;
    proteinPer100g: string;
    fatsPer100g: string;
    carbsPer100g: string;
}

/**
 * One line of the composition, with what that weight of that product actually
 * contributes — the numbers the ingredient row prints (meal-details FR-004).
 */
export class RecipeIngredientEntity {
    readonly id: string;
    readonly productId: string;
    readonly name: string;
    readonly amountG: number;
    readonly calories: number;
    readonly proteinG: number;
    readonly fatsG: number;
    readonly carbsG: number;

    private constructor(row: RecipeIngredientRowWithProduct) {
        this.id = row.id;
        this.productId = row.productId;
        this.name = row.name;
        this.amountG = Number(row.amountG);

        const ratio = this.amountG / 100;
        this.calories = round(Number(row.caloriesPer100g) * ratio);
        this.proteinG = round(Number(row.proteinPer100g) * ratio);
        this.fatsG = round(Number(row.fatsPer100g) * ratio);
        this.carbsG = round(Number(row.carbsPer100g) * ratio);
    }

    static from(row: RecipeIngredientRowWithProduct): RecipeIngredientEntity {
        return new RecipeIngredientEntity(row);
    }
}

export interface RecipeStepRowWithText extends RecipeStepRow {
    title: string;
    description: string | null;
}

export class RecipeStepEntity {
    readonly id: string;
    readonly stepNumber: number;
    readonly durationMinutes: number | null;
    readonly title: string;
    readonly description: string | null;

    private constructor(row: RecipeStepRowWithText) {
        this.id = row.id;
        this.stepNumber = row.stepNumber;
        this.durationMinutes = row.durationMinutes;
        this.title = row.title;
        this.description = row.description;
    }

    static from(row: RecipeStepRowWithText): RecipeStepEntity {
        return new RecipeStepEntity(row);
    }
}

function round(value: number): number {
    return Math.round(value * 10) / 10;
}
