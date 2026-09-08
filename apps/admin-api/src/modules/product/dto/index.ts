import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import type { AdminProductDetail, AdminProductListItem } from '@dns/database';
import { ContentSource } from '@dns/shared-types';
import {
    adminCreateProductSchema,
    adminProductListQuerySchema,
    adminSetProductArchivedSchema,
    adminSetProductVerifiedSchema,
    adminUpdateProductSchema,
} from '@dns/validation';

export class CreateProductInboundDto extends createZodDto(adminCreateProductSchema) {}
export class UpdateProductInboundDto extends createZodDto(adminUpdateProductSchema) {}
export class ProductListQueryDto extends createZodDto(adminProductListQuerySchema) {}
export class SetProductVerifiedInboundDto extends createZodDto(adminSetProductVerifiedSchema) {}
export class SetProductArchivedInboundDto extends createZodDto(adminSetProductArchivedSchema) {}

/** One row of the products table. Macros are numbers here — the panel does arithmetic. */
export class AdminProductView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;
    @ApiProperty({ example: 'Помідори' }) readonly name: string;

    @ApiProperty({ nullable: true, description: 'The identity a recipe CSV addresses it by.' })
    readonly nameEn: string | null;

    @ApiProperty({ enum: ContentSource }) readonly source: ContentSource;
    @ApiProperty({ nullable: true }) readonly groupSlug: string | null;
    @ApiProperty() readonly caloriesPer100g: number;
    @ApiProperty() readonly proteinPer100g: number;
    @ApiProperty() readonly fatsPer100g: number;
    @ApiProperty() readonly carbsPer100g: number;
    @ApiProperty({ nullable: true }) readonly servingWeightG: number | null;

    @ApiProperty({ description: 'Shown as a one-tap chip on the app filter screen.' })
    readonly isQuickPick: boolean;

    @ApiProperty() readonly isVerified: boolean;

    @ApiProperty({ nullable: true, description: 'Null for catalogue products; set while a user still owns it.' })
    readonly createdBy: string | null;

    @ApiProperty({ nullable: true, description: 'Set means out of the catalogue but still referenced.' })
    readonly archivedAt: string | null;

    @ApiProperty() readonly createdAt: string;

    protected constructor(row: AdminProductListItem) {
        this.id = row.id;
        this.name = row.name;
        this.nameEn = row.nameEn;
        this.source = row.source;
        this.groupSlug = row.groupSlug;
        this.caloriesPer100g = Number(row.caloriesPer100g);
        this.proteinPer100g = Number(row.proteinPer100g);
        this.fatsPer100g = Number(row.fatsPer100g);
        this.carbsPer100g = Number(row.carbsPer100g);
        this.servingWeightG = row.servingWeightG === null ? null : Number(row.servingWeightG);
        this.isQuickPick = row.isQuickPick;
        this.isVerified = row.isVerified;
        this.createdBy = row.createdBy;
        this.archivedAt = row.archivedAt?.toISOString() ?? null;
        this.createdAt = row.createdAt.toISOString();
    }

    static from(row: AdminProductListItem): AdminProductView {
        return new AdminProductView(row);
    }
}

export class AdminProductDetailView extends AdminProductView {
    @ApiProperty({ nullable: true, format: 'uuid' }) readonly groupId: string | null;

    @ApiProperty({ description: 'Every language the product has a name in.' })
    readonly translations: { language: string; name: string; servingLabel: string | null }[];

    @ApiProperty({ description: 'Catalogue dishes using it — what the archive dialog reports.' })
    readonly usedInRecipes: number;

    private constructor(product: AdminProductDetail) {
        super(product);
        this.groupId = product.groupId;
        this.translations = product.translations;
        this.usedInRecipes = product.usedInRecipes;
    }

    static fromDetail(product: AdminProductDetail): AdminProductDetailView {
        return new AdminProductDetailView(product);
    }
}
