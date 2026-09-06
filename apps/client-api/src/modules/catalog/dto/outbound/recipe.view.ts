import { ApiProperty } from '@nestjs/swagger';

import { RecipeEntity, RecipeIngredientEntity, RecipeStepEntity } from '@dns/database';
import { ContentSource } from '@dns/shared-types';

import { RecipeDetail } from '../../recipe.service';

import { ReferenceView } from './reference.view';

/** Calories and macros for one scope — a serving, or the whole dish. */
export class NutritionView {
    @ApiProperty() readonly calories: number;
    @ApiProperty() readonly proteinG: number;
    @ApiProperty() readonly fatsG: number;
    @ApiProperty() readonly carbsG: number;

    @ApiProperty({ nullable: true }) readonly weightG: number | null;

    private constructor(values: {
        calories: number;
        proteinG: number;
        fatsG: number;
        carbsG: number;
        weightG: number | null;
    }) {
        this.calories = values.calories;
        this.proteinG = values.proteinG;
        this.fatsG = values.fatsG;
        this.carbsG = values.carbsG;
        this.weightG = values.weightG;
    }

    static perServing(recipe: RecipeEntity): NutritionView {
        return new NutritionView({
            calories: recipe.caloriesPerServing,
            proteinG: recipe.proteinPerServingG,
            fatsG: recipe.fatsPerServingG,
            carbsG: recipe.carbsPerServingG,
            weightG: recipe.servingWeightG,
        });
    }

    static total(recipe: RecipeEntity): NutritionView {
        return new NutritionView({
            calories: recipe.calories,
            proteinG: recipe.proteinG,
            fatsG: recipe.fatsG,
            carbsG: recipe.carbsG,
            weightG: recipe.totalWeightG,
        });
    }
}

/**
 * A card in the catalogue (recipes-list FR-003).
 *
 * The figures are **per serving**, because that is what the card prints and
 * what the calorie filter narrows by. The whole-dish totals are on the detail
 * response, where the design asks for them — putting both here would leave the
 * client guessing which «ккал» it is holding.
 */
export class RecipeCardView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;
    @ApiProperty() readonly title: string;

    @ApiProperty({ enum: ContentSource }) readonly source: ContentSource;

    @ApiProperty({ nullable: true }) readonly photoUrl: string | null;
    @ApiProperty({ nullable: true }) readonly cookTimeMinutes: number | null;
    @ApiProperty() readonly servings: number;

    @ApiProperty({ type: NutritionView }) readonly perServing: NutritionView;

    @ApiProperty() readonly isFavorite: boolean;

    protected constructor(recipe: RecipeEntity) {
        this.id = recipe.id;
        this.title = recipe.title;
        this.source = recipe.source;
        this.photoUrl = recipe.photoUrl;
        this.cookTimeMinutes = recipe.cookTimeMinutes;
        this.servings = recipe.servings;
        this.perServing = NutritionView.perServing(recipe);
        this.isFavorite = recipe.isFavorite;
    }

    static from(recipe: RecipeEntity): RecipeCardView {
        return new RecipeCardView(recipe);
    }
}

export class RecipeIngredientView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;
    @ApiProperty({ format: 'uuid', description: 'The product behind this line — what a picker links back to.' })
    readonly productId: string;
    @ApiProperty() readonly name: string;
    @ApiProperty() readonly amountG: number;
    @ApiProperty() readonly calories: number;
    @ApiProperty() readonly proteinG: number;
    @ApiProperty() readonly fatsG: number;
    @ApiProperty() readonly carbsG: number;

    private constructor(ingredient: RecipeIngredientEntity) {
        this.id = ingredient.id;
        this.productId = ingredient.productId;
        this.name = ingredient.name;
        this.amountG = ingredient.amountG;
        this.calories = ingredient.calories;
        this.proteinG = ingredient.proteinG;
        this.fatsG = ingredient.fatsG;
        this.carbsG = ingredient.carbsG;
    }

    static from(ingredient: RecipeIngredientEntity): RecipeIngredientView {
        return new RecipeIngredientView(ingredient);
    }
}

export class RecipeStepView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;
    @ApiProperty() readonly stepNumber: number;
    @ApiProperty() readonly title: string;
    @ApiProperty({ nullable: true }) readonly description: string | null;
    @ApiProperty({ nullable: true }) readonly durationMinutes: number | null;

    private constructor(step: RecipeStepEntity) {
        this.id = step.id;
        this.stepNumber = step.stepNumber;
        this.title = step.title;
        this.description = step.description;
        this.durationMinutes = step.durationMinutes;
    }

    static from(step: RecipeStepEntity): RecipeStepView {
        return new RecipeStepView(step);
    }
}

/** Everything the detail screen needs in one response — the card, plus what is behind it. */
export class RecipeDetailView extends RecipeCardView {
    @ApiProperty({ type: NutritionView, description: 'The whole cooked dish, which is what the summary row shows.' })
    readonly total: NutritionView;

    @ApiProperty({ type: ReferenceView, nullable: true }) readonly category: ReferenceView | null;
    @ApiProperty({ type: ReferenceView, nullable: true }) readonly cuisine: ReferenceView | null;
    @ApiProperty({ type: [ReferenceView] }) readonly diets: ReferenceView[];

    @ApiProperty({ type: [RecipeIngredientView] }) readonly ingredients: RecipeIngredientView[];

    @ApiProperty({ type: [RecipeStepView], description: 'In order; empty on a dish saved without a method.' })
    readonly steps: RecipeStepView[];

    private constructor(detail: RecipeDetail) {
        super(detail.recipe);
        this.total = NutritionView.total(detail.recipe);
        this.category = detail.recipe.category ? ReferenceView.from(detail.recipe.category) : null;
        this.cuisine = detail.recipe.cuisine ? ReferenceView.from(detail.recipe.cuisine) : null;
        this.diets = detail.recipe.diets.map(ReferenceView.from);
        this.ingredients = detail.ingredients.map(RecipeIngredientView.from);
        this.steps = detail.steps.map(RecipeStepView.from);
    }

    static fromDetail(detail: RecipeDetail): RecipeDetailView {
        return new RecipeDetailView(detail);
    }
}
