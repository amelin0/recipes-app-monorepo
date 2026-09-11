import { Injectable } from '@nestjs/common';
import { SQL, and, desc, eq, gte, sql } from 'drizzle-orm';

import { BodyMetric } from '@dns/shared-types';

import { BodyMeasurementEntity } from '../../entities';
import { bodyMeasurements, profiles } from '../../schema';
import { BaseRepository, DrizzleDB } from '../base.repository';

type InsertBodyMeasurement = typeof bodyMeasurements.$inferInsert;
type Transaction = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

/**
 * «Latest» everywhere a reading is called that: the card's current value and
 * the number carried into the profile must be the same reading, so they share
 * one order. By the day the reading belongs to, then the most recently
 * entered, then the id — so two readings on one day still have exactly one
 * latest, and it does not depend on which request happened to commit last.
 */
const NEWEST_FIRST = [desc(bodyMeasurements.measuredOn), desc(bodyMeasurements.createdAt), desc(bodyMeasurements.id)];

/**
 * The profile column that follows a metric's latest reading. Waist has none:
 * no formula reads it.
 */
const PROFILE_COLUMN: Partial<Record<BodyMetric, 'weightKg' | 'heightCm'>> = {
    [BodyMetric.Weight]: 'weightKg',
    [BodyMetric.Height]: 'heightCm',
};

@Injectable()
export class BodyMeasurementRepository extends BaseRepository {
    /**
     * Records a reading and, for weight and height, makes the profile hold the
     * **latest reading by date** — not whichever write landed last.
     *
     * The calorie recommendation is computed from the profile
     * (metric-logging FR-006), so the profile must agree with the card. Two
     * ways it used to not:
     *
     * - sequentially, a back-dated entry (yesterday's weight entered today)
     *   overwrote the profile with the older value;
     * - concurrently, the profile ended on whichever request committed last.
     *
     * So the profile is set from the table, in the same transaction as the
     * insert, under a row lock on the profile taken **first**. The lock is what
     * makes the recompute see every reading committed before it: under READ
     * COMMITTED an `UPDATE` that waits on a row lock keeps the snapshot its
     * subquery started with, and would write a latest that is already stale.
     */
    async record(data: InsertBodyMeasurement): Promise<BodyMeasurementEntity> {
        const column = PROFILE_COLUMN[data.metric as BodyMetric];

        if (!column) {
            const [row] = await this.db.insert(bodyMeasurements).values(data).returning();
            if (!row) throw new Error('Failed to insert body measurement');
            return BodyMeasurementEntity.from(row);
        }

        return this.db.transaction(async tx => {
            await lockProfile(tx, data.userId);

            const [row] = await tx.insert(bodyMeasurements).values(data).returning();
            if (!row) throw new Error('Failed to insert body measurement');

            await followLatest(tx, data.userId, data.metric as BodyMetric, column);

            return BodyMeasurementEntity.from(row);
        });
    }

    /** Newest first — the order the record list renders in (metric-detail FR-008). */
    async findSince(userId: string, metric: BodyMetric, since: string): Promise<BodyMeasurementEntity[]> {
        const rows = await this.db.query.bodyMeasurements.findMany({
            where: and(
                eq(bodyMeasurements.userId, userId),
                eq(bodyMeasurements.metric, metric),
                gte(bodyMeasurements.measuredOn, since),
            ),
            orderBy: NEWEST_FIRST,
        });

        return rows.map(BodyMeasurementEntity.from);
    }

    /**
     * The most recent reading, however old. Separate from `findSince` because
     * the card must show a current value even when the window holds nothing —
     * a weight from two months ago is still this person's weight.
     */
    async findLatest(userId: string, metric: BodyMetric): Promise<BodyMeasurementEntity | null> {
        const row = await this.db.query.bodyMeasurements.findFirst({
            where: and(eq(bodyMeasurements.userId, userId), eq(bodyMeasurements.metric, metric)),
            orderBy: NEWEST_FIRST,
        });

        return row ? BodyMeasurementEntity.from(row) : null;
    }

    /** The first ever reading — what «initial» compares against on a metric with no goal (overview FR-003). */
    async findFirst(userId: string, metric: BodyMetric): Promise<BodyMeasurementEntity | null> {
        const row = await this.db.query.bodyMeasurements.findFirst({
            where: and(eq(bodyMeasurements.userId, userId), eq(bodyMeasurements.metric, metric)),
            orderBy: [bodyMeasurements.measuredOn, bodyMeasurements.createdAt],
        });

        return row ? BodyMeasurementEntity.from(row) : null;
    }

    /**
     * Scoped by owner as well as id, so one account cannot delete another's
     * reading.
     *
     * Deleting the latest weight or height hands the profile back to the one
     * before it, in the same transaction and under the same lock as `record` —
     * otherwise the recommendation would go on being computed from a reading
     * that no longer exists. The lock is taken before the delete because the
     * metric is not known until the row comes back.
     */
    async delete(userId: string, id: string): Promise<boolean> {
        return this.db.transaction(async tx => {
            await lockProfile(tx, userId);

            const [deleted] = await tx
                .delete(bodyMeasurements)
                .where(and(eq(bodyMeasurements.id, id), eq(bodyMeasurements.userId, userId)))
                .returning({ metric: bodyMeasurements.metric });

            if (!deleted) return false;

            const column = PROFILE_COLUMN[deleted.metric as BodyMetric];
            if (column) await followLatest(tx, userId, deleted.metric as BodyMetric, column);

            return true;
        });
    }
}

/**
 * Takes the lock every weight or height write to the profile queues behind —
 * `FOR NO KEY UPDATE`, the same strength the `UPDATE` that follows needs, so it
 * blocks nothing an update would not.
 */
async function lockProfile(tx: Transaction, userId: string): Promise<void> {
    await tx.select({ userId: profiles.userId }).from(profiles).where(eq(profiles.userId, userId)).for('no key update');
}

/**
 * Sets the profile column to the metric's latest reading, rounded to the
 * profile's one decimal — the precision the questionnaire writes. Keeps the
 * current value when no reading is left, since there is nothing better to
 * put there: the questionnaire answer it replaced is not stored anywhere else.
 */
async function followLatest(
    tx: Transaction,
    userId: string,
    metric: BodyMetric,
    column: 'weightKg' | 'heightCm',
): Promise<void> {
    const latest = tx
        .select({ value: sql`round(${bodyMeasurements.value}, 1)` })
        .from(bodyMeasurements)
        .where(and(eq(bodyMeasurements.userId, userId), eq(bodyMeasurements.metric, metric)))
        .orderBy(...NEWEST_FIRST)
        .limit(1);

    const value: SQL = sql`coalesce((${latest}), ${profiles[column]})`;

    await tx
        .update(profiles)
        .set(
            column === 'weightKg'
                ? { weightKg: value, updatedAt: new Date() }
                : { heightCm: value, updatedAt: new Date() },
        )
        .where(eq(profiles.userId, userId));
}
