import { ApiProperty } from '@nestjs/swagger';

import { ReferenceEntity } from '@dns/database';

/**
 * Which dictionary a tag came from.
 *
 * The panel draws one flat list of chips, but the kinds are **not**
 * interchangeable: a dish has one category, one cuisine, and any number of
 * diets. That is why writes take `categoryId` / `cuisineId` / `dietIds`
 * separately instead of a flat `tagIds` — flattening the write side would let
 * two cuisines through and leave validation to catch what the form should
 * have prevented.
 */
export enum TagKind {
    Category = 'category',
    Cuisine = 'cuisine',
    Diet = 'diet',
}

export class TagView {
    @ApiProperty({ format: 'uuid' })
    readonly id: string;

    @ApiProperty({ enum: TagKind })
    readonly kind: TagKind;

    @ApiProperty({ example: 'salads' })
    readonly slug: string;

    @ApiProperty({ example: 'Салати', description: 'Resolved into the requested language.' })
    readonly name: string;

    @ApiProperty({ nullable: true, example: '🥗' })
    readonly emoji: string | null;

    private constructor(kind: TagKind, reference: ReferenceEntity) {
        this.id = reference.id;
        this.kind = kind;
        this.slug = reference.slug;
        this.name = reference.name;
        this.emoji = reference.emoji;
    }

    static from(kind: TagKind, reference: ReferenceEntity): TagView {
        return new TagView(kind, reference);
    }
}
