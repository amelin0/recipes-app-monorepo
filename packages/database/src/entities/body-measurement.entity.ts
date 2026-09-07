import { BodyMetric } from '@dns/shared-types';

import { bodyMeasurements } from '../schema';

type BodyMeasurementRow = typeof bodyMeasurements.$inferSelect;

export class BodyMeasurementEntity {
    readonly id: string;
    readonly userId: string;
    readonly metric: BodyMetric;
    readonly value: number;
    readonly measuredOn: string;
    readonly createdAt: Date;

    private constructor(row: BodyMeasurementRow) {
        this.id = row.id;
        this.userId = row.userId;
        this.metric = row.metric as BodyMetric;
        // `numeric` arrives as a string to protect precision; converted once here.
        this.value = Number(row.value);
        this.measuredOn = row.measuredOn;
        this.createdAt = row.createdAt;
    }

    static from(row: BodyMeasurementRow): BodyMeasurementEntity {
        return new BodyMeasurementEntity(row);
    }
}
