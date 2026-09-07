import { ApiProperty } from '@nestjs/swagger';

import { AdminRecipeDetail, AdminRecipeListItem } from '@dns/database';

/** One row of the catalogue table. */
export class AdminRecipeListItemView {
    @ApiProperty({ format: 'uuid' })
    readonly id: string;

    @ApiProperty({ example: 'Грецький салат' })
    readonly title: string;

    @ApiProperty({ nullable: true })
    readonly photoUrl: string | null;

    @ApiProperty({ description: 'For the whole dish. Per serving is this divided by `servings`.' })
    readonly calories: number;

    @ApiProperty() readonly proteinG: number;
    @ApiProperty() readonly fatsG: number;
    @ApiProperty() readonly carbsG: number;
    @ApiProperty() readonly servings: number;

    @ApiProperty({ nullable: true }) readonly cookTimeMinutes: number | null;

    @ApiProperty({ nullable: true, description: 'Set only on dishes that arrived through an import.' })
    readonly importKey: string | null;

    @ApiProperty({ description: 'How many users have hearted it.' })
    readonly favoritesCount: number;

    @ApiProperty({ nullable: true }) readonly categorySlug: string | null;
    @ApiProperty({ nullable: true }) readonly cuisineSlug: string | null;

    @ApiProperty() readonly updatedAt: string;

    private constructor(row: AdminRecipeListItem) {
        this.id = row.id;
        this.title = row.title;
        this.photoUrl = row.photoUrl;
        this.calories = row.calories;
        // `numeric` arrives as a string so transit loses no precision; the
        // panel does arithmetic on it, so it is converted once, here.
        this.proteinG = Number(row.proteinG);
        this.fatsG = Number(row.fatsG);
        this.carbsG = Number(row.carbsG);
        this.servings = row.servings;
        this.cookTimeMinutes = row.cookTimeMinutes;
        this.importKey = row.importKey;
        this.favoritesCount = row.favoritesCount;
        this.categorySlug = row.categorySlug;
        this.cuisineSlug = row.cuisineSlug;
        this.updatedAt = row.updatedAt.toISOString();
    }

    static from(row: AdminRecipeListItem): AdminRecipeListItemView {
        return new AdminRecipeListItemView(row);
    }
}

/**
 * The whole dish, as the edit form loads it.
 *
 * One representation, not a `/full` variant alongside a lighter one: two
 * nearly identical shapes drift, and the difference is a handful of joins on
 * a screen that opens one recipe at a time.
 */
export class AdminRecipeDetailView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;
    @ApiProperty({ nullable: true }) readonly importKey: string | null;
    @ApiProperty({ nullable: true }) readonly photoUrl: string | null;
    @ApiProperty() readonly servings: number;
    @ApiProperty({ nullable: true }) readonly cookTimeMinutes: number | null;
    @ApiProperty({ nullable: true }) readonly totalWeightG: number | null;
    @ApiProperty() readonly calories: number;
    @ApiProperty() readonly proteinG: number;
    @ApiProperty() readonly fatsG: number;
    @ApiProperty() readonly carbsG: number;
    @ApiProperty({ nullable: true, format: 'uuid' }) readonly categoryId: string | null;
    @ApiProperty({ nullable: true, format: 'uuid' }) readonly cuisineId: string | null;
    @ApiProperty({ type: String, isArray: true }) readonly dietIds: string[];
    @ApiProperty() readonly favoritesCount: number;

    @ApiProperty({ description: 'One entry per language the dish has a title in.' })
    readonly translations: { language: string; title: string }[];

    @ApiProperty({ description: 'Ordered. `amountG` is grams — the only unit the model has.' })
    readonly ingredients: { id: string; productId: string; productName: string; amountG: number; sortOrder: number }[];

    @ApiProperty({ description: '`ingredientIds` point at rows of `ingredients` above, not at products.' })
    readonly steps: {
        id: string;
        stepNumber: number;
        durationMinutes: number | null;
        translations: { language: string; title: string; description: string | null }[];
        ingredientIds: string[];
    }[];

    @ApiProperty() readonly createdAt: string;
    @ApiProperty() readonly updatedAt: string;

    private constructor(recipe: AdminRecipeDetail) {
        this.id = recipe.id;
        this.importKey = recipe.importKey;
        this.photoUrl = recipe.photoUrl;
        this.servings = recipe.servings;
        this.cookTimeMinutes = recipe.cookTimeMinutes;
        this.totalWeightG = recipe.totalWeightG === null ? null : Number(recipe.totalWeightG);
        this.calories = recipe.calories;
        this.proteinG = Number(recipe.proteinG);
        this.fatsG = Number(recipe.fatsG);
        this.carbsG = Number(recipe.carbsG);
        this.categoryId = recipe.categoryId;
        this.cuisineId = recipe.cuisineId;
        this.dietIds = recipe.dietIds;
        this.favoritesCount = recipe.favoritesCount;
        this.translations = recipe.translations;
        this.ingredients = recipe.ingredients.map(line => ({ ...line, amountG: Number(line.amountG) }));
        this.steps = recipe.steps;
        this.createdAt = recipe.createdAt.toISOString();
        this.updatedAt = recipe.updatedAt.toISOString();
    }

    static from(recipe: AdminRecipeDetail): AdminRecipeDetailView {
        return new AdminRecipeDetailView(recipe);
    }
}

/** What a CSV import did, row by row where it failed (FR-002). */
export class ImportReportView {
    @ApiProperty() readonly created: number;
    @ApiProperty() readonly updated: number;
    @ApiProperty() readonly skipped: number;

    @ApiProperty({
        description:
            'One entry per rejected row. `row` is the line number in the file, so an editor can go and fix it.',
    })
    readonly errors: { row: number; importKey: string | null; message: string }[];

    constructor(report: {
        created: number;
        updated: number;
        skipped: number;
        errors: { row: number; importKey: string | null; message: string }[];
    }) {
        this.created = report.created;
        this.updated = report.updated;
        this.skipped = report.skipped;
        this.errors = report.errors;
    }
}
