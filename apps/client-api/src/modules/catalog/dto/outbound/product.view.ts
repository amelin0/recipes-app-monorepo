import { ApiProperty } from '@nestjs/swagger';

import { ProductEntity } from '@dns/database';
import { ContentSource } from '@dns/shared-types';

import { ReferenceView } from './reference.view';

/**
 * A product as the search row and the ingredient picker read it
 * (recipe-search FR-003).
 *
 * Macros are per 100 g — the only figure actually stored. The serving line
 * («1 шт · 89 г · 20 ккал») is computed from it here rather than on the client,
 * so two screens cannot round it two different ways.
 */
export class ProductView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;
    @ApiProperty() readonly name: string;

    @ApiProperty({ enum: ContentSource, description: 'Shipped by us, or created by this account.' })
    readonly source: ContentSource;

    @ApiProperty({ type: ReferenceView, nullable: true }) readonly group: ReferenceView | null;

    @ApiProperty() readonly caloriesPer100g: number;
    @ApiProperty() readonly proteinPer100g: number;
    @ApiProperty() readonly fatsPer100g: number;
    @ApiProperty() readonly carbsPer100g: number;

    @ApiProperty({ nullable: true, example: '1 шт' }) readonly servingLabel: string | null;
    @ApiProperty({ nullable: true, example: 89 }) readonly servingWeightG: number | null;

    @ApiProperty({ nullable: true, description: 'What one serving comes to; null when no serving weight is known.' })
    readonly servingCalories: number | null;

    @ApiProperty() readonly isVerified: boolean;

    private constructor(product: ProductEntity) {
        this.id = product.id;
        this.name = product.name;
        this.source = product.source;
        this.group = product.group ? ReferenceView.from(product.group) : null;
        this.caloriesPer100g = product.caloriesPer100g;
        this.proteinPer100g = product.proteinPer100g;
        this.fatsPer100g = product.fatsPer100g;
        this.carbsPer100g = product.carbsPer100g;
        this.servingLabel = product.servingLabel;
        this.servingWeightG = product.servingWeightG;
        this.servingCalories =
            product.servingWeightG === null
                ? null
                : Math.round((product.caloriesPer100g * product.servingWeightG) / 100);
        this.isVerified = product.isVerified;
    }

    static from(product: ProductEntity): ProductView {
        return new ProductView(product);
    }
}
