import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { UserEntity } from '../../entities';
import { users } from '../../schema';
import { BaseRepository } from '../base.repository';

type InsertUser = typeof users.$inferInsert;

@Injectable()
export class UserRepository extends BaseRepository {
    /**
     * The caller passes an already-lower-cased address. Normalisation lives in
     * the service so exactly one place decides what "the same email" means.
     */
    async findByEmail(email: string): Promise<UserEntity | null> {
        const row = await this.db.query.users.findFirst({ where: eq(users.email, email) });
        return row ? UserEntity.from(row) : null;
    }

    async findById(id: string): Promise<UserEntity | null> {
        const row = await this.db.query.users.findFirst({ where: eq(users.id, id) });
        return row ? UserEntity.from(row) : null;
    }

    async create(data: InsertUser): Promise<UserEntity> {
        const [row] = await this.db.insert(users).values(data).returning();
        if (!row) throw new Error('Failed to insert user');
        return UserEntity.from(row);
    }

    async markEmailVerified(id: string): Promise<void> {
        await this.db.update(users).set({ emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, id));
    }

    async setPasswordHash(id: string, passwordHash: string): Promise<void> {
        await this.db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id));
    }
}
