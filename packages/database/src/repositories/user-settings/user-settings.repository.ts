import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { UserSettingsEntity } from '../../entities';
import { userSettings } from '../../schema';
import { BaseRepository } from '../base.repository';

type UpdateUserSettings = Partial<Omit<typeof userSettings.$inferInsert, 'userId' | 'createdAt' | 'updatedAt'>>;

@Injectable()
export class UserSettingsRepository extends BaseRepository {
    async findByUserId(userId: string): Promise<UserSettingsEntity | null> {
        const row = await this.db.query.userSettings.findFirst({ where: eq(userSettings.userId, userId) });
        return row ? UserSettingsEntity.from(row) : null;
    }

    /** Partial by design: the client sends only the switch it flipped. */
    async update(userId: string, data: UpdateUserSettings): Promise<UserSettingsEntity> {
        const [row] = await this.db
            .update(userSettings)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(userSettings.userId, userId))
            .returning();

        if (!row) throw new Error(`Settings not found for user ${userId}`);
        return UserSettingsEntity.from(row);
    }
}
