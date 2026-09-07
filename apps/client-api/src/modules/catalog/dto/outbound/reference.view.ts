import { ApiProperty } from '@nestjs/swagger';

import { ReferenceEntity } from '@dns/database';

/**
 * One option in a filter group — a category, a cuisine, a diet, a product
 * group. All four look the same to the screen, so they share one shape.
 *
 * The name arrives already resolved into the reader's language; the client
 * never sees the translation table.
 */
export class ReferenceView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;

    @ApiProperty({ description: 'Stable code — what to log or key a picture off, never what to display.' })
    readonly slug: string;

    @ApiProperty({ nullable: true }) readonly emoji: string | null;

    @ApiProperty({ nullable: true, description: 'Illustration; only dish categories have one.' })
    readonly imageUrl: string | null;

    @ApiProperty() readonly name: string;

    private constructor(reference: ReferenceEntity) {
        this.id = reference.id;
        this.slug = reference.slug;
        this.emoji = reference.emoji;
        this.imageUrl = reference.imageUrl;
        this.name = reference.name;
    }

    static from(reference: ReferenceEntity): ReferenceView {
        return new ReferenceView(reference);
    }
}
