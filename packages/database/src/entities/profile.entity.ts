import { profiles } from '../schema';

type ProfileRow = typeof profiles.$inferSelect;

export class ProfileEntity {
    readonly userId: string;
    readonly name: string | null;
    readonly photoUrl: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    private constructor(row: ProfileRow) {
        this.userId = row.userId;
        this.name = row.name;
        this.photoUrl = row.photoUrl;
        this.createdAt = row.createdAt;
        this.updatedAt = row.updatedAt;
    }

    static from(row: ProfileRow): ProfileEntity {
        return new ProfileEntity(row);
    }

    /**
     * Up to two uppercase initials, the avatar's fallback when there is no
     * photo (profile FR-001). Derived here rather than on the client so every
     * surface spells them the same way.
     */
    initials(): string {
        if (!this.name) return '';

        return this.name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(word => word.charAt(0).toUpperCase())
            .join('');
    }
}
