import { ReminderType } from '@dns/shared-types';

import { userReminders } from '../schema';

type UserReminderRow = typeof userReminders.$inferSelect;

export class UserReminderEntity {
    readonly id: string;
    readonly userId: string;
    readonly type: ReminderType;
    readonly enabled: boolean;
    /** `HH:mm:ss` wall-clock time; meals only. */
    readonly timeOfDay: string | null;
    /** Weigh-in only. */
    readonly periodicityDays: number | null;
    readonly nextFireAt: Date | null;

    private constructor(row: UserReminderRow) {
        this.id = row.id;
        this.userId = row.userId;
        this.type = row.type as ReminderType;
        this.enabled = row.enabled;
        this.timeOfDay = row.timeOfDay;
        this.periodicityDays = row.periodicityDays;
        this.nextFireAt = row.nextFireAt;
    }

    static from(row: UserReminderRow): UserReminderEntity {
        return new UserReminderEntity(row);
    }

    isWeighIn(): boolean {
        return this.type === ReminderType.WeighIn;
    }
}
