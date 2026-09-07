import { ApiProperty } from '@nestjs/swagger';

import { ProductEntity } from '@dns/database';

/**
 * A product as the composition editor needs it: enough to pick one, and the
 * per-100 g macros so the form can show the running total without a second
 * round trip per ingredient.
 */
export class AdminProductView {
    @ApiProperty({ format: 'uuid' })
    readonly id: string;

    @ApiProperty({ example: 'Tomatoes' })
    readonly name: string;

    @ApiProperty({ nullable: true, example: 'Овочі' })
    readonly groupName: string | null;

    @ApiProperty({ example: 18 })
    readonly caloriesPer100g: number;

    @ApiProperty({ example: 0.9 })
    readonly proteinPer100g: number;

    @ApiProperty({ example: 0.2 })
    readonly fatsPer100g: number;

    @ApiProperty({ example: 3.9 })
    readonly carbsPer100g: number;

    @ApiProperty({ nullable: true, description: 'What one typical serving weighs, when known.' })
    readonly servingWeightG: number | null;

    private constructor(product: ProductEntity) {
        this.id = product.id;
        this.name = product.name;
        this.groupName = product.group?.name ?? null;
        this.caloriesPer100g = product.caloriesPer100g;
        this.proteinPer100g = product.proteinPer100g;
        this.fatsPer100g = product.fatsPer100g;
        this.carbsPer100g = product.carbsPer100g;
        this.servingWeightG = product.servingWeightG;
    }

    static from(product: ProductEntity): AdminProductView {
        return new AdminProductView(product);
    }
}
