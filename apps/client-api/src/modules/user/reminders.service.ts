import { Injectable } from '@nestjs/common';

import { ReminderPatch, UserReminderEntity, UserReminderRepository } from '@dns/database';
import { ReminderType } from '@dns/shared-types';
import { UpdateRemindersInput } from '@dns/validation';

@Injectable()
export class RemindersService {
    constructor(private readonly reminderRepository: UserReminderRepository) {}

    /** Ordered so the screen renders the same sequence every time. */
    async list(userId: string): Promise<UserReminderEntity[]> {
        const reminders = await this.reminderRepository.findAllForUser(userId);
        return reminders.sort((a, b) => REMINDER_ORDER.indexOf(a.type) - REMINDER_ORDER.indexOf(b.type));
    }

    /**
     * Saves the screen as a unit (FR-005). The weigh-in's cadence is not
     * editable here (FR-004), so a patch for it can only flip `enabled` —
     * `periodicityDays` and `nextFireAt` are left untouched rather than reset.
     */
    async update(userId: string, { reminders }: UpdateRemindersInput): Promise<UserReminderEntity[]> {
        const patches: ReminderPatch[] = reminders.map(({ type, enabled, time }) => ({
            type,
            enabled,
            ...(time === undefined ? {} : { timeOfDay: `${time}:00` }),
        }));

        await this.reminderRepository.applyPatches(userId, patches);

        return this.list(userId);
    }
}

const REMINDER_ORDER: readonly ReminderType[] = [
    ReminderType.Breakfast,
    ReminderType.Snack,
    ReminderType.Lunch,
    ReminderType.Dinner,
    ReminderType.WeighIn,
];
