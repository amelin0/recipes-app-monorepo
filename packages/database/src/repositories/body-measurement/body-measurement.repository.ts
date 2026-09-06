import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte } from 'drizzle-orm';

import { BodyMetric } from '@dns/shared-types';

import { BodyMeasurementEntity } from '../../entities';
import { bodyMeasurements } from '../../schema';
import { BaseRepository } from '../base.repository';

type InsertBodyMeasurement = typeof bodyMeasurements.$inferInsert;

@Injectable()
export class BodyMeasurementRepository extends BaseRepository {
    async create(data: InsertBodyMeasurement): Promise<BodyMeasurementEntity> {
        const [row] = await this.db.insert(bodyMeasurements).values(data).returning();
        if (!row) throw new Error('Failed to insert body measurement');
        return BodyMeasurementEntity.from(row);
    }

    /** Newest first — the order the record list renders in (metric-detail FR-008). */
    async findSince(userId: string, metric: BodyMetric, since: string): Promise<BodyMeasurementEntity[]> {
        const rows = await this.db.query.bodyMeasurements.findMany({
            where: and(
                eq(bodyMeasurements.userId, userId),
                eq(bodyMeasurements.metric, metric),
                gte(bodyMeasurements.measuredOn, since),
            ),
            orderBy: [desc(bodyMeasurements.measuredOn), desc(bodyMeasurements.createdAt)],
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
            orderBy: [desc(bodyMeasurements.measuredOn), desc(bodyMeasurements.createdAt)],
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

    /** Scoped by owner as well as id, so one account cannot delete another's reading. */
    async delete(userId: string, id: string): Promise<boolean> {
        const deleted = await this.db
            .delete(bodyMeasurements)
            .where(and(eq(bodyMeasurements.id, id), eq(bodyMeasurements.userId, userId)))
            .returning({ id: bodyMeasurements.id });

        return deleted.length > 0;
    }
}
