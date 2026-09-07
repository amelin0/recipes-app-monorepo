import { BadRequestException, Injectable } from '@nestjs/common';

import {
    ageFromBirthDate,
    DAILY_STEPS_TARGET_DEFAULT,
    macroTargetsFor,
    ONBOARDING_LIMITS,
    recommendedDailyNorms,
} from '@dns/constants';
import { NutritionRepository, ProfileEntity, ProfileRepository } from '@dns/database';
import { BodyProfile, DailyNorms, MacroTargets, UserGoal } from '@dns/shared-types';
import { CompleteOnboardingInput, SaveOnboardingStepInput } from '@dns/validation';

import { UserErrorCode } from './user.errors';

/** The recommendation plus the split it implies — what steps 14–16 and the summary render. */
export interface Recommendations {
    norms: DailyNorms;
    macros: MacroTargets;
}

@Injectable()
export class OnboardingService {
    constructor(
        private readonly profileRepository: ProfileRepository,
        private readonly nutritionRepository: NutritionRepository,
    ) {}

    /**
     * Saves whatever the current step answered.
     *
     * Answers land one at a time because an interrupted questionnaire must
     * resume where it stopped (FR-005) — waiting for all sixteen would lose
     * everything to a closed app.
     */
    async saveStep(profile: ProfileEntity, input: SaveOnboardingStepInput): Promise<ProfileEntity> {
        const { step, weightKg, heightCm, targetWeightKg, ...rest } = input;

        // Choosing «learn to cook» makes a target weight meaningless, so a
        // stale one from an earlier pass through the questionnaire is dropped
        // rather than left to contradict the goal (FR-006f).
        const clearsTarget = rest.goal === UserGoal.LearnCooking;

        return this.profileRepository.update(profile.userId, {
            ...rest,
            ...(weightKg === undefined ? {} : { weightKg: weightKg.toFixed(1) }),
            ...(heightCm === undefined ? {} : { heightCm: heightCm.toFixed(1) }),
            ...(clearsTarget
                ? { targetWeightKg: null }
                : targetWeightKg === undefined
                  ? {}
                  : { targetWeightKg: targetWeightKg === null ? null : targetWeightKg.toFixed(1) }),
            // Never moves backwards: revisiting an earlier step to change an
            // answer must not make the app resume from there next time.
            ...(step === undefined ? {} : { onboardingStep: Math.max(step, profile.onboardingStep) }),
        });
    }

    /**
     * Recomputes from whatever the profile holds right now.
     *
     * Deliberately live rather than stored: after a weight change the
     * recommendation should follow, which is exactly what
     * `progress/metric-logging` expects. The value frozen at the moment a goal
     * was saved is a different thing and lives on `nutrition_goals`.
     */
    recommendations(profile: ProfileEntity): Recommendations | null {
        const body = this.bodyProfile(profile);
        if (!body) return null;

        const norms = recommendedDailyNorms(body);

        return { norms, macros: macroTargetsFor(norms.calories, body.goal) };
    }

    /**
     * Ends the questionnaire: marks it done and turns the answers into the
     * daily goal.
     *
     * The two happen together on purpose. Steps 14–16 *are* the goal screen in
     * disguise, and leaving the account marked complete but goal-less would
     * drop the user onto a tracking screen with no rings and no idea why.
     */
    async complete(profile: ProfileEntity, input: CompleteOnboardingInput): Promise<ProfileEntity> {
        const body = this.bodyProfile(profile);

        if (!body) {
            throw new BadRequestException({
                message: 'The questionnaire has unanswered questions',
                code: UserErrorCode.OnboardingIncomplete,
            });
        }

        const recommended = recommendedDailyNorms(body);
        // The split follows the calories the user settled on, not the ones we
        // suggested — they may have moved the dial (FR-006h).
        const macros = macroTargetsFor(input.dailyCalories, body.goal);

        await this.nutritionRepository.upsertGoal({
            userId: profile.userId,
            dailyCalories: input.dailyCalories,
            dailyProteinG: macros.proteinG,
            dailyFatsG: macros.fatsG,
            dailyCarbsG: macros.carbsG,
            dailyWaterMl: input.dailyWaterMl,
            dailyFiberG: macros.fiberG,
            dailyStepsTarget: input.dailySteps || DAILY_STEPS_TARGET_DEFAULT,
            // Frozen here so «how far did they move from the recommendation»
            // stays answerable later, when a fresh one would have shifted.
            recommendedCalories: recommended.calories,
            recommendedWaterMl: recommended.waterMl,
            recommendedSteps: recommended.steps,
        });

        return this.profileRepository.update(profile.userId, {
            onboardingCompletedAt: new Date(),
            onboardingStep: ONBOARDING_LIMITS.stepCount,
        });
    }

    /**
     * The answers the formulas need, or null while any of them is missing.
     * Returning null rather than substituting defaults is the point: a norm
     * computed from a guessed weight would look just as authoritative as a
     * real one.
     */
    private bodyProfile(profile: ProfileEntity): BodyProfile | null {
        const { gender, birthDate, weightKg, heightCm, activityLevel, goal } = profile;

        if (!gender || !birthDate || weightKg === null || heightCm === null || !activityLevel || !goal) {
            return null;
        }

        return { gender, age: ageFromBirthDate(new Date(birthDate)), weightKg, heightCm, activityLevel, goal };
    }
}
