import { ApiProperty } from '@nestjs/swagger';

import { ProfileEntity } from '@dns/database';
import { Gender, UserGoal } from '@dns/shared-types';

import { Recommendations } from '../../onboarding.service';

/** Where the questionnaire stands and what it has collected so far. */
export class OnboardingStateView {
    @ApiProperty({ description: 'Where to resume. The flag below, not this, says whether it is done.' })
    readonly step: number;

    @ApiProperty() readonly completed: boolean;

    @ApiProperty({ nullable: true }) readonly name: string | null;
    @ApiProperty({ enum: Gender, nullable: true }) readonly gender: Gender | null;
    @ApiProperty({ nullable: true, example: '1995-06-15' }) readonly birthDate: string | null;
    @ApiProperty({ nullable: true, description: 'Always kilograms, whatever the user reads.' })
    readonly weightKg: number | null;
    @ApiProperty({ nullable: true, description: 'Always centimetres.' }) readonly heightCm: number | null;
    @ApiProperty({ nullable: true, description: '1–8.' }) readonly activityLevel: number | null;
    @ApiProperty({ enum: UserGoal, nullable: true }) readonly goal: UserGoal | null;
    @ApiProperty({ nullable: true, description: 'Absent when the goal is not about weight.' })
    readonly targetWeightKg: number | null;

    private constructor(profile: ProfileEntity) {
        this.step = profile.onboardingStep;
        this.completed = profile.hasCompletedOnboarding();
        this.name = profile.name;
        this.gender = profile.gender;
        this.birthDate = profile.birthDate;
        this.weightKg = profile.weightKg;
        this.heightCm = profile.heightCm;
        this.activityLevel = profile.activityLevel;
        this.goal = profile.goal;
        this.targetWeightKg = profile.targetWeightKg;
    }

    static from(profile: ProfileEntity): OnboardingStateView {
        return new OnboardingStateView(profile);
    }
}

/**
 * What the server suggests. `null` while the questionnaire has not collected
 * enough to compute anything — the screens then show their own placeholder
 * rather than a number derived from guesses.
 */
export class RecommendationsView {
    @ApiProperty() readonly calories: number;
    @ApiProperty() readonly waterMl: number;
    @ApiProperty() readonly steps: number;
    @ApiProperty() readonly proteinG: number;
    @ApiProperty() readonly fatsG: number;
    @ApiProperty() readonly carbsG: number;
    @ApiProperty() readonly fiberG: number;

    private constructor({ norms, macros }: Recommendations) {
        this.calories = norms.calories;
        this.waterMl = norms.waterMl;
        this.steps = norms.steps;
        this.proteinG = macros.proteinG;
        this.fatsG = macros.fatsG;
        this.carbsG = macros.carbsG;
        this.fiberG = macros.fiberG;
    }

    static from(recommendations: Recommendations): RecommendationsView {
        return new RecommendationsView(recommendations);
    }
}
