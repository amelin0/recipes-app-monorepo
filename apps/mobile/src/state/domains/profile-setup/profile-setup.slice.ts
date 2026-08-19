import type { StateCreator } from 'zustand';

export type Gender = 'male' | 'female';
export type UnitSystem = 'metric' | 'imperial';
export type Goal = 'maintain' | 'gain-muscle' | 'lose-weight' | 'learn-cooking';

/** Answers collected by the post-registration questionnaire. */
export interface ProfileSetupAnswers {
    name: string;
    gender: Gender | null;
    /** ISO `yyyy-mm-dd`. */
    birthDate: string | null;
    unitSystem: UnitSystem | null;
    /** Always stored metric; the wheels convert for display. */
    weightKg: number | null;
    heightCm: number | null;
    /** 1–8, matching the legend on the activity step. */
    activityLevel: number | null;
    goal: Goal | null;
    targetWeightKg: number | null;
    /** Daily goals the user can nudge away from the recommendation. */
    calorieGoal: number | null;
    waterGoalMl: number | null;
    stepsGoal: number | null;
}

export interface ProfileSetupSlice {
    profileSetup: ProfileSetupAnswers;
    setProfileSetupAnswerAction: <K extends keyof ProfileSetupAnswers>(key: K, value: ProfileSetupAnswers[K]) => void;
    resetProfileSetup: () => void;
}

export const PROFILE_SETUP_DEFAULTS: ProfileSetupAnswers = {
    name: '',
    gender: null,
    birthDate: null,
    unitSystem: null,
    weightKg: null,
    heightCm: null,
    activityLevel: null,
    goal: null,
    targetWeightKg: null,
    calorieGoal: null,
    waterGoalMl: null,
    stepsGoal: null,
};

/**
 * The questionnaire is 14 steps long, so answers are kept per step (and
 * persisted) — a killed app resumes instead of starting over. See
 * docs/specs/client/onboarding/profile-setup/spec.md, FR-005.
 */
export const createProfileSetupSlice: StateCreator<ProfileSetupSlice, [], [], ProfileSetupSlice> = set => ({
    profileSetup: PROFILE_SETUP_DEFAULTS,
    setProfileSetupAnswerAction: (key, value) =>
        set(state => ({ profileSetup: { ...state.profileSetup, [key]: value } })),
    resetProfileSetup: () => set(() => ({ profileSetup: PROFILE_SETUP_DEFAULTS })),
});
