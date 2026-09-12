/**
 * Profile DTOs — hand-written from the deployed spec plus the API source.
 * The document types every nullable field as a bare `object`, so the real
 * shapes come from `apps/client-api/src/modules/user/dto/outbound/`.
 */

export type UnitSystem = 'METRIC' | 'IMPERIAL';
export type AppThemeSetting = 'light' | 'dark' | 'system';
export type Gender = 'male' | 'female';
export type UserGoal = 'maintain' | 'gain-muscle' | 'lose-weight' | 'learn-cooking';

export interface UserSettings {
    /** Twenty values server-side; the app ships `uk` only for now. */
    language: string;
    theme: AppThemeSetting;
    massUnit: UnitSystem;
    productWeightUnit: UnitSystem;
    lengthUnit: UnitSystem;
    waterUnit: UnitSystem;
}

export interface Profile {
    id: string;
    email: string;
    name: string | null;
    photoUrl: string | null;
    /** Server-derived, so every surface shows the same two letters. Empty until a name exists. */
    initials: string;
    targetWeightKg: number | null;
    settings: UserSettings;
    /**
     * Optional on purpose: the field exists in the API source but the deployed
     * stand still answers without it. Read the subscription from
     * `GET /subscription` and treat this as an optimisation when it appears.
     */
    subscription?: unknown | null;
}

export interface UpdateProfilePayload {
    name?: string;
    photoUrl?: string | null;
    targetWeightKg?: number | null;
}

/** Partial write — only the switch the user flipped (ADR-0004, rule 4). */
export type UpdateSettingsPayload = Partial<UserSettings>;

export interface OnboardingState {
    step: number;
    completed: boolean;
    name: string | null;
    gender: Gender | null;
    /** YYYY-MM-DD. */
    birthDate: string | null;
    weightKg: number | null;
    heightCm: number | null;
    /** 1–8, matching the eight-row legend on the activity screen. */
    activityLevel: number | null;
    goal: UserGoal | null;
    targetWeightKg: number | null;
}

export type SaveOnboardingPayload = Partial<Omit<OnboardingState, 'completed'>>;

export interface OnboardingRecommendations {
    calories: number;
    waterMl: number;
    steps: number;
    proteinG: number;
    fatsG: number;
    carbsG: number;
    fiberG: number;
}

export interface CompleteOnboardingPayload {
    dailyCalories: number;
    dailyWaterMl: number;
    dailySteps: number;
}

export type ReminderKind = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'weigh_in';

export interface Reminder {
    type: ReminderKind;
    enabled: boolean;
    /** `HH:mm` wall-clock for meals; null for the weigh-in, which carries a cadence. */
    time: string | null;
    periodicityDays: number | null;
    nextFireAt: string | null;
}

export interface ReminderPatch {
    type: ReminderKind;
    enabled: boolean;
    /** Required for meals, forbidden for the weigh-in — the server 422s on either mistake. */
    time?: string;
}

export interface UpdateRemindersPayload {
    reminders: ReminderPatch[];
}

export type FeedbackType = 'bug' | 'not_working' | 'improvement' | 'feature_request' | 'other';
export type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'rejected';

export interface CreateFeedbackPayload {
    type: FeedbackType;
    description: string;
    /** Public URLs from `POST /uploads`, scope `feedback`; at most three. */
    imageUrls?: string[];
    replyEmail?: string;
    /** App version, platform, OS build — deliberately open-ended (FR-008). */
    context?: Record<string, string | number | boolean>;
}

export interface Feedback {
    id: string;
    type: FeedbackType;
    status: FeedbackStatus;
    createdAt: string;
}

export type AccountDeletionState = 'active' | 'cancelled' | 'executed';

export interface AccountDeletionRequest {
    id: string;
    requestedAt: string;
    /** When the account is actually erased — the countdown on the recovery screen. */
    scheduledFor: string;
    state: AccountDeletionState;
}
