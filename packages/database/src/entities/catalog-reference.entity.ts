/**
 * The four filter dictionaries share one read shape: an id the client sends
 * back, a slug code refers to, the emoji or picture the chip shows, and a name
 * already resolved into the reader's language.
 *
 * One entity for all four rather than four identical ones — the row they come
 * from differs only in which table it sits in, and the screen treats them the
 * same way.
 */
export interface ReferenceRow {
    id: string;
    slug: string;
    emoji: string | null;
    imageUrl?: string | null;
    sortOrder: number;
    name: string;
}

export class ReferenceEntity {
    readonly id: string;
    readonly slug: string;
    readonly emoji: string | null;
    readonly imageUrl: string | null;
    readonly sortOrder: number;
    readonly name: string;

    private constructor(row: ReferenceRow) {
        this.id = row.id;
        this.slug = row.slug;
        this.emoji = row.emoji;
        this.imageUrl = row.imageUrl ?? null;
        this.sortOrder = row.sortOrder;
        this.name = row.name;
    }

    static from(row: ReferenceRow): ReferenceEntity {
        return new ReferenceEntity(row);
    }
}
