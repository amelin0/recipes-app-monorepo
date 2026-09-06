import { Gender, UserGoal } from '@dns/shared-types';

import { profiles } from '../schema';

type ProfileRow = typeof profiles.$inferSelect;

export class ProfileEntity {
    readonly userId: string;
    readonly name: string | null;
    readonly photoUrl: string | null;
    readonly gender: Gender | null;
    readonly birthDate: string | null;
    readonly weightKg: number | null;
    readonly heightCm: number | null;
    readonly activityLevel: number | null;
    readonly goal: UserGoal | null;
    readonly targetWeightKg: number | null;
    readonly onboardingStep: number;
    readonly onboardingCompletedAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    private constructor(row: ProfileRow) {
        this.userId = row.userId;
        this.name = row.name;
        this.photoUrl = row.photoUrl;
        this.gender = row.gender as Gender | null;
        this.birthDate = row.birthDate;
        // Postgres returns `numeric` as a string to protect precision; the
        // conversion happens once here rather than at each call site.
        this.weightKg = row.weightKg === null ? null : Number(row.weightKg);
        this.heightCm = row.heightCm === null ? null : Number(row.heightCm);
        this.activityLevel = row.activityLevel;
        this.goal = row.goal as UserGoal | null;
        this.targetWeightKg = row.targetWeightKg === null ? null : Number(row.targetWeightKg);
        this.onboardingStep = row.onboardingStep;
        this.onboardingCompletedAt = row.onboardingCompletedAt;
        this.createdAt = row.createdAt;
        this.updatedAt = row.updatedAt;
    }

    static from(row: ProfileRow): ProfileEntity {
        return new ProfileEntity(row);
    }

    hasCompletedOnboarding(): boolean {
        return this.onboardingCompletedAt !== null;
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
