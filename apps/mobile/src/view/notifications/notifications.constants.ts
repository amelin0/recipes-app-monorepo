import type { AppNotification } from '@/data';

/** One day of notifications, as the list renders them. */
export interface NotificationGroup {
    key: string;
    /** «Сьогодні», «Вчора» or «31 липня». */
    label: string;
    items: AppNotification[];
}
