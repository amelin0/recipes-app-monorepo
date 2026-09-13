import { HttpService } from '@/shared/services';

import type {
    AccountDeletionRequest,
    CompleteOnboardingPayload,
    CreateFeedbackPayload,
    Feedback,
    OnboardingRecommendations,
    OnboardingState,
    Profile,
    Reminder,
    SaveOnboardingPayload,
    UpdateProfilePayload,
    UpdateRemindersPayload,
    UpdateSettingsPayload,
    UserSettings,
} from './user.types';

const ENDPOINTS = {
    profile: '/profile',
    settings: '/profile/settings',
    onboarding: '/profile/onboarding',
    onboardingComplete: '/profile/onboarding/complete',
    recommendations: '/profile/recommendations',
    reminders: '/profile/reminders',
    feedback: '/profile/feedback',
    deletionRequest: '/profile/deletion-request',
} as const;

export const UserApi = {
    getProfile: () => HttpService.get<Profile>(ENDPOINTS.profile),

    updateProfile: (payload: UpdateProfilePayload) => HttpService.patch<Profile>(ENDPOINTS.profile, payload),

    /** Answers with the settings alone — NOT the whole profile, unlike `PATCH /profile`. */
    updateSettings: (payload: UpdateSettingsPayload) => HttpService.patch<UserSettings>(ENDPOINTS.settings, payload),

    getOnboarding: () => HttpService.get<OnboardingState>(ENDPOINTS.onboarding),

    /** One step at a time; every field is optional. */
    saveOnboarding: (payload: SaveOnboardingPayload) => HttpService.put<OnboardingState>(ENDPOINTS.onboarding, payload),

    /** Writes the daily goal; 400 `user.onboarding-incomplete` when answers are missing. */
    completeOnboarding: (payload: CompleteOnboardingPayload) =>
        HttpService.post<void>(ENDPOINTS.onboardingComplete, payload),

    /** `null` until the questionnaire has enough answers to compute a norm. */
    getRecommendations: () => HttpService.get<OnboardingRecommendations | null>(ENDPOINTS.recommendations),

    getReminders: () => HttpService.get<Reminder[]>(ENDPOINTS.reminders),

    /** The screen saves as a unit, so the request carries the whole set. */
    updateReminders: (payload: UpdateRemindersPayload) => HttpService.put<Reminder[]>(ENDPOINTS.reminders, payload),

    sendFeedback: (payload: CreateFeedbackPayload) => HttpService.post<Feedback>(ENDPOINTS.feedback, payload),

    requestDeletion: () => HttpService.post<AccountDeletionRequest>(ENDPOINTS.deletionRequest),

    /** Restores the account inside the grace window; 204. */
    cancelDeletion: () => HttpService.delete<void>(ENDPOINTS.deletionRequest),
};
