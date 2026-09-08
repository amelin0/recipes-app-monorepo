import { NotificationEvent, NotificationType } from '@dns/shared-types';

import { DEFAULT_LANGUAGE } from './language';

/** What a producer needs to fill in for one message. */
export interface NotificationTemplateInput {
    /** «до 12 жовтня», a plan name, a product name — whatever the text needs. */
    subject?: string;
}

export interface NotificationTemplate {
    type: NotificationType;
    title: string;
    body: string;
    subtitle?: string;
    /** Both or neither — the card shows one action at its foot. */
    actionLabel?: string;
    actionRoute?: string;
}

type Writer = (input: NotificationTemplateInput) => NotificationTemplate;

/**
 * The words each event is written in.
 *
 * They live here, beside the other tables the API reads, rather than in a
 * service: a notification's text is **stored, not rendered on read** (see the
 * schema), so what matters is that the wording is written down once and picked
 * by data — not that some object can build it.
 *
 * Only events that are actually produced appear below. The enum also declares
 * events nothing writes yet; giving them templates would suggest a message
 * exists when it does not.
 */
const TEMPLATES: Partial<Record<NotificationEvent, Record<string, Writer>>> = {
    [NotificationEvent.SubscriptionActivated]: {
        uk: ({ subject }) => ({
            type: NotificationType.Subscription,
            title: 'Преміум активний',
            body: subject ? `Підписка діє до ${subject}.` : 'Підписка активована.',
            actionLabel: 'Мій профіль',
            actionRoute: '/profile',
        }),
        en: ({ subject }) => ({
            type: NotificationType.Subscription,
            title: 'Premium is active',
            body: subject ? `Your subscription runs until ${subject}.` : 'Your subscription is active.',
            actionLabel: 'My profile',
            actionRoute: '/profile',
        }),
    },

    // Says what happened and nothing more: the referrer's free month is not
    // granted anywhere yet, and a message that promised it would be the only
    // part of the product claiming otherwise.
    [NotificationEvent.ReferralRedeemed]: {
        uk: () => ({
            type: NotificationType.System,
            title: 'Вашим кодом скористалися',
            body: 'Хтось приєднався за вашим запрошенням.',
            actionLabel: 'Мої запрошення',
            actionRoute: '/profile/referral',
        }),
        en: () => ({
            type: NotificationType.System,
            title: 'Your code was used',
            body: 'Someone joined with your invitation.',
            actionLabel: 'My invitations',
            actionRoute: '/profile/referral',
        }),
    },

    // Written by the nightly job, not by a request: a subscription's end is
    // the one thing here that happens without anybody doing anything.
    [NotificationEvent.SubscriptionExpiring]: {
        uk: ({ subject }) => ({
            type: NotificationType.Subscription,
            title: 'Преміум незабаром закінчиться',
            body: subject ? `Підписка діє до ${subject}.` : 'Підписка скоро завершується.',
            actionLabel: 'Продовжити',
            actionRoute: '/subscription',
        }),
        en: ({ subject }) => ({
            type: NotificationType.Subscription,
            title: 'Premium ends soon',
            body: subject ? `Your subscription runs until ${subject}.` : 'Your subscription ends soon.',
            actionLabel: 'Renew',
            actionRoute: '/subscription',
        }),
    },

    [NotificationEvent.SubscriptionExpired]: {
        uk: ({ subject }) => ({
            type: NotificationType.Subscription,
            title: 'Преміум завершився',
            body: subject ? `Підписка діяла до ${subject}.` : 'Підписка завершилася.',
            actionLabel: 'Оформити знову',
            actionRoute: '/subscription',
        }),
        en: ({ subject }) => ({
            type: NotificationType.Subscription,
            title: 'Premium has ended',
            body: subject ? `Your subscription ran until ${subject}.` : 'Your subscription has ended.',
            actionLabel: 'Subscribe again',
            actionRoute: '/subscription',
        }),
    },

    [NotificationEvent.AccountDeletionRequested]: {
        uk: ({ subject }) => ({
            type: NotificationType.System,
            title: 'Акаунт заплановано до видалення',
            body: subject
                ? `Дані буде стерто ${subject}. Доти передумати ще можна.`
                : 'Дані буде стерто після пільгового періоду. Доти передумати ще можна.',
            actionLabel: 'Скасувати видалення',
            actionRoute: '/profile/deletion-request',
        }),
        en: ({ subject }) => ({
            type: NotificationType.System,
            title: 'Account scheduled for deletion',
            body: subject
                ? `Your data will be erased on ${subject}. You can still change your mind.`
                : 'Your data will be erased after the grace period. You can still change your mind.',
            actionLabel: 'Cancel deletion',
            actionRoute: '/profile/deletion-request',
        }),
    },

    [NotificationEvent.AccountDeletionCancelled]: {
        uk: () => ({
            type: NotificationType.System,
            title: 'Видалення скасовано',
            body: 'Акаунт лишається з вами. Дані на місці.',
        }),
        en: () => ({
            type: NotificationType.System,
            title: 'Deletion cancelled',
            body: 'Your account stays. Nothing was erased.',
        }),
    },

    [NotificationEvent.ProductVerified]: {
        uk: ({ subject }) => ({
            type: NotificationType.System,
            title: 'Ваш продукт у каталозі',
            body: subject
                ? `«${subject}» перевірено — тепер його бачать усі.`
                : 'Ваш продукт перевірено — тепер його бачать усі.',
        }),
        en: ({ subject }) => ({
            type: NotificationType.System,
            title: 'Your product is in the catalogue',
            body: subject ? `«${subject}» has been verified — everyone can find it now.` : 'Your product has been verified — everyone can find it now.',
        }),
    },
};

/**
 * The words for one event in one language.
 *
 * Falls back to Ukrainian rather than to English: it is the language the rest
 * of the data coalesces onto, and a message in the fallback language is far
 * better than a message that never gets written.
 *
 * Returns `null` for an event with no template — that is the declared-but-not-
 * produced case, and a caller that reaches it has a bug worth seeing rather
 * than a blank message worth shipping.
 */
export function notificationTemplate(
    event: NotificationEvent,
    language: string,
    input: NotificationTemplateInput = {},
): NotificationTemplate | null {
    const byLanguage = TEMPLATES[event];
    if (!byLanguage) return null;

    const write = byLanguage[language] ?? byLanguage[DEFAULT_LANGUAGE];
    return write ? write(input) : null;
}

/** Events that have words. Everything else in the enum is declared, not produced. */
export const PRODUCED_NOTIFICATION_EVENTS = Object.keys(TEMPLATES) as NotificationEvent[];
