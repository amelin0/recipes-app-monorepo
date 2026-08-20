export type NotificationAction = 'update' | 'report' | 'subscription';

export interface NotificationItem {
    id: string;
    title: string;
    body: string;
    /** Already formatted, e.g. «10:45». */
    time: string;
    read: boolean;
    /** Second line under the title on the detail screen. */
    subtitle?: string;
    /** Heading above the bullet list on the detail screen. */
    detailsTitle?: string;
    /** Body of the detail screen; falls back to `body` when omitted. */
    bullets?: string[];
    /** Grey chip under the details, e.g. «Розмір файлу: 42.5 MB». */
    tag?: string;
    /** Renders the call to action at the bottom of the detail card. */
    action?: NotificationAction;
}

export interface NotificationGroup {
    /** Already formatted, e.g. «Сьогодні» or «31 липня». */
    key: string;
    label: string;
    items: NotificationItem[];
}

/**
 * TODO: replace with the notifications endpoint (811:67086). Grouping by day
 * and the relative «Сьогодні» label are the server's job or the client's — an
 * open question in the spec.
 */
export const MOCK_NOTIFICATIONS: NotificationGroup[] = [
    {
        key: 'today',
        label: 'Сьогодні',
        items: [
            {
                id: 'protein-morning',
                title: '🍳 Білок зранку',
                body: 'Додай яйця, сир або рибу до сніданку - ввечері менше тягтиме на солодке.',
                time: '10:45',
                read: false,
            },
            {
                id: 'lunch-time',
                title: '🥙 Обід у той самий час',
                body: 'Обідай приблизно в один час - режим працює краще за хаос.',
                time: '10:45',
                read: false,
            },
            {
                id: 'dinner',
                title: '🍝 Не віддавай вечерю ворогу',
                body: 'Зроби її легшою, але не пропускай узагалі.',
                time: '10:45',
                read: true,
            },
        ],
    },
    {
        key: '2026-07-31',
        label: '31 липня',
        items: [
            {
                id: 'app-update',
                title: 'Доступне оновлення системи',
                body: 'Оновіть застосунок до версії 2.4.0, щоб отримати нові віджети та покращення швидкодії.',
                time: '10:45',
                read: false,
                subtitle: 'Застосунок • Версія 2.4.0',
                detailsTitle: 'Що нового в цій версії:',
                bullets: [
                    'Додано нові кастомізовані віджети для робочого столу.',
                    'Оновлено розділ налаштувань конфіденційності та безпеки.',
                    'Виправлено помилку відображення довгих текстів у віджеті сповіщень.',
                    'Оптимізовано споживання заряду батареї при фоновому оновленні.',
                ],
                tag: 'Розмір файлу: 42.5 MB',
                action: 'update',
            },
            {
                id: 'snack',
                title: '🥜 Горіхи, зерна, ягоди',
                body: 'Збери перекус із трьох складників - і познач його.',
                time: '10:45',
                read: false,
            },
            {
                id: 'week-report',
                title: 'Тиждень позаду ✅',
                body: 'Відкрий звіт і подивись, як він пройшов.',
                time: '10:45',
                read: true,
                action: 'report',
            },
        ],
    },
];
