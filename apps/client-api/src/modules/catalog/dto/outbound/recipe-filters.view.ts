import { ApiProperty } from '@nestjs/swagger';

import { RecipeFilterOptions } from '../../recipe.service';

import { ProductView } from './product.view';
import { ReferenceView } from './reference.view';

export class CalorieRangeView {
    @ApiProperty() readonly min: number;

    @ApiProperty({ description: 'Also «800+»: a request pinned here means no upper limit at all.' })
    readonly max: number;

    @ApiProperty() readonly step: number;

    private constructor(range: { min: number; max: number; step: number }) {
        this.min = range.min;
        this.max = range.max;
        this.step = range.step;
    }

    static from(range: { min: number; max: number; step: number }): CalorieRangeView {
        return new CalorieRangeView(range);
    }
}

/**
 * Every option the filter screen can offer, in one response.
 *
 * The screen shows five groups at once and needs a slider range on top; five
 * round trips to draw one screen is the waterfall the client is built to avoid.
 */
export class RecipeFiltersView {
    @ApiProperty({ type: [ProductView], description: 'The fifteen one-tap ingredient chips (recipe-filters FR-002).' })
    readonly quickProducts: ProductView[];

    @ApiProperty({ type: [ReferenceView] }) readonly categories: ReferenceView[];
    @ApiProperty({ type: [ReferenceView] }) readonly productGroups: ReferenceView[];
    @ApiProperty({ type: [ReferenceView] }) readonly cuisines: ReferenceView[];
    @ApiProperty({ type: [ReferenceView] }) readonly diets: ReferenceView[];

    @ApiProperty({ type: CalorieRangeView }) readonly calories: CalorieRangeView;

    private constructor(options: RecipeFilterOptions) {
        this.quickProducts = options.quickProducts.map(ProductView.from);
        this.categories = options.categories.map(ReferenceView.from);
        this.productGroups = options.productGroups.map(ReferenceView.from);
        this.cuisines = options.cuisines.map(ReferenceView.from);
        this.diets = options.diets.map(ReferenceView.from);
        this.calories = CalorieRangeView.from(options.calories);
    }

    static from(options: RecipeFilterOptions): RecipeFiltersView {
        return new RecipeFiltersView(options);
    }
}
