import type { PageMeta } from '../catalog';

export type NotificationKind = 'reminder' | 'system' | 'subscription';

export interface AppNotification {
    id: string;
    type: NotificationKind;
    title: string;
    body: string;
    /** Second line under the title on the detail screen. */
    subtitle: string | null;
    /** The bullet list a fuller message carries; empty otherwise. */
    items: string[];
    /** Grey chip under the details, e.g. «Розмір файлу: 42.5 MB». */
    metaLabel: string | null;
    /** Present only together with `actionRoute`. */
    actionLabel: string | null;
    /** Where the button goes, as the app understands routes. */
    actionRoute: string | null;
    isRead: boolean;
    /** ISO instant. The client groups by day — only it knows its timezone. */
    createdAt: string;
}

export interface NotificationsQuery {
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
}

export interface NotificationsPage {
    data: AppNotification[];
    meta: PageMeta;
}

export interface UnreadCount {
    count: number;
}
