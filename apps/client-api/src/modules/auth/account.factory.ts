import { MEAL_REMINDER_DEFAULTS, USER_SETTINGS_DEFAULTS, WEIGH_IN_PERIODICITY_DAYS_DEFAULT } from '@dns/constants';
import { CreateAccountInput } from '@dns/database';
import { ReminderType } from '@dns/shared-types';

interface NewAccount {
    email: string;
    emailVerified?: boolean;
}

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * The rows every new account starts with, wherever it comes from —
 * registration or a provider.
 *
 * Lives in the auth module because auth is what creates accounts, and is
 * shared by both entry points so a user made through Google cannot end up
 * with a different starting state than one made with a password.
 *
 * Every account starts without a password — a registration's password waits
 * on its confirmation code (`otp_codes.password_hash`) and reaches the
 * account only when that code is verified.
 */
export function newAccountInput({ email, emailVerified = false }: NewAccount): CreateAccountInput {
    const now = new Date();

    return {
        user: {
            email,
            passwordHash: null,
            emailVerifiedAt: emailVerified ? now : null,
        },
        profile: {
            // The questionnaire or the edit screen fills this in; until then
            // the avatar falls back to initials of nothing, which the design
            // handles.
            name: null,
        },
        settings: { ...USER_SETTINGS_DEFAULTS },
        reminders: [
            ...MEAL_REMINDER_DEFAULTS.map(({ type, hour, minute }) => ({
                type,
                enabled: true,
                timeOfDay: `${pad(hour)}:${pad(minute)}:00`,
            })),
            {
                type: ReminderType.WeighIn,
                enabled: true,
                periodicityDays: WEIGH_IN_PERIODICITY_DAYS_DEFAULT,
                nextFireAt: new Date(now.getTime() + WEIGH_IN_PERIODICITY_DAYS_DEFAULT * 86_400_000),
            },
        ],
    };
}
