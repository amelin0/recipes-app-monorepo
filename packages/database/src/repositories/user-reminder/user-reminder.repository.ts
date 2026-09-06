import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { ReminderType } from '@dns/shared-types';

import { UserReminderEntity } from '../../entities';
import { userReminders } from '../../schema';
import { BaseRepository } from '../base.repository';

type ReminderUpdate = Partial<Pick<typeof userReminders.$inferInsert, 'enabled' | 'timeOfDay' | 'nextFireAt'>>;

export interface ReminderPatch extends ReminderUpdate {
    type: ReminderType;
}

@Injectable()
export class UserReminderRepository extends BaseRepository {
    async findAllForUser(userId: string): Promise<UserReminderEntity[]> {
        const rows = await this.db.query.userReminders.findMany({ where: eq(userReminders.userId, userId) });
        return rows.map(UserReminderEntity.from);
    }

    /**
     * Applies the whole screen's changes in one transaction. The reminder
     * screen saves as a unit («Зберегти зміни»), so a partial write would
     * leave the user looking at a schedule that is half old and half new.
     *
     * Rows are updated, never inserted: every account gets its five at
     * sign-up, so a missing type means a bug, not a first save.
     */
    async applyPatches(userId: string, patches: ReminderPatch[]): Promise<UserReminderEntity[]> {
        if (patches.length > 0) {
            await this.db.transaction(async tx => {
                for (const { type, ...changes } of patches) {
                    await tx
                        .update(userReminders)
                        .set({ ...changes, updatedAt: new Date() })
                        .where(and(eq(userReminders.userId, userId), eq(userReminders.type, type)));
                }
            });
        }

        return this.findAllForUser(userId);
    }
}
