import { ContentSource } from '@dns/shared-types';

import { products } from '../schema';

import { ReferenceEntity } from './catalog-reference.entity';

type ProductRow = typeof products.$inferSelect;

/** A product with its name already resolved into one language. */
export interface ProductRowWithName extends ProductRow {
    name: string;
    servingLabel: string | null;
    group?: ReferenceEntity | null;
}

export class ProductEntity {
    readonly id: string;
    readonly source: ContentSource;
    readonly name: string;
    readonly group: ReferenceEntity | null;
    readonly caloriesPer100g: number;
    readonly proteinPer100g: number;
    readonly fatsPer100g: number;
    readonly carbsPer100g: number;
    readonly servingLabel: string | null;
    readonly servingWeightG: number | null;
    readonly isQuickPick: boolean;
    readonly isVerified: boolean;
    readonly createdBy: string | null;

    private constructor(row: ProductRowWithName) {
        this.id = row.id;
        this.source = row.source as ContentSource;
        this.name = row.name;
        this.group = row.group ?? null;
        // `numeric` comes back as a string so no precision is lost in transit;
        // everything downstream does arithmetic, so it is converted once here.
        this.caloriesPer100g = Number(row.caloriesPer100g);
        this.proteinPer100g = Number(row.proteinPer100g);
        this.fatsPer100g = Number(row.fatsPer100g);
        this.carbsPer100g = Number(row.carbsPer100g);
        this.servingLabel = row.servingLabel;
        this.servingWeightG = row.servingWeightG === null ? null : Number(row.servingWeightG);
        this.isQuickPick = row.isQuickPick;
        this.isVerified = row.isVerified;
        this.createdBy = row.createdBy;
    }

    static from(row: ProductRowWithName): ProductEntity {
        return new ProductEntity(row);
    }
}
