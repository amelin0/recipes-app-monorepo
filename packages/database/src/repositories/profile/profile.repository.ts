import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { ProfileEntity } from '../../entities';
import { profiles } from '../../schema';
import { BaseRepository } from '../base.repository';

type UpdateProfile = Partial<Pick<typeof profiles.$inferInsert, 'name' | 'photoUrl'>>;

@Injectable()
export class ProfileRepository extends BaseRepository {
    async findByUserId(userId: string): Promise<ProfileEntity | null> {
        const row = await this.db.query.profiles.findFirst({ where: eq(profiles.userId, userId) });
        return row ? ProfileEntity.from(row) : null;
    }

    async update(userId: string, data: UpdateProfile): Promise<ProfileEntity> {
        const [row] = await this.db
            .update(profiles)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(profiles.userId, userId))
            .returning();

        if (!row) throw new Error(`Profile not found for user ${userId}`);
        return ProfileEntity.from(row);
    }
}
