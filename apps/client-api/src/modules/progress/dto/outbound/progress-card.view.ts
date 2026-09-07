import { ApiProperty } from '@nestjs/swagger';

import { BodyMeasurementEntity } from '@dns/database';
import { DailyOutcome, MetricKind, ProgressMetric } from '@dns/shared-types';

import { DailyDistribution, MetricDetail, OneOffSummary, ProgressCard } from '../../progress.service';

interface ProgressPointInput {
    id?: string;
    date: string;
    value: number;
    target?: number | null;
    outcome?: DailyOutcome | null;
}

/**
 * One point on a chart, whichever kind of chart it is.
 *
 * The two kinds are deliberately one shape rather than a union: a line point
 * and a bar differ only in which fields are filled, and a client that has to
 * branch on the payload's shape before it can read a date ends up writing the
 * discriminator twice. `kind` on the card says which fields to expect.
 */
export class ProgressPointView {
    @ApiProperty({
        nullable: true,
        format: 'uuid',
        description: 'Present only on a measured point — what a delete targets.',
    })
    readonly id: string | null;

    @ApiProperty({ example: '2026-09-06' }) readonly date: string;

    @ApiProperty() readonly value: number;

    @ApiProperty({ nullable: true, description: 'The daily goal in force; null on a metric with no target.' })
    readonly target: number | null;

    @ApiProperty({ enum: DailyOutcome, nullable: true })
    readonly outcome: DailyOutcome | null;

    private constructor(point: ProgressPointInput) {
        this.id = point.id ?? null;
        this.date = point.date;
        this.value = point.value;
        this.target = point.target ?? null;
        this.outcome = point.outcome ?? null;
    }

    static from(point: ProgressPointInput): ProgressPointView {
        return new ProgressPointView(point);
    }
}

/** A card on the progress screen: the current number, what it is aiming at, and the history behind it. */
export class ProgressCardView {
    @ApiProperty({ enum: ProgressMetric }) readonly metric: ProgressMetric;

    @ApiProperty({ enum: MetricKind, description: 'Decides the chart and which point fields are filled.' })
    readonly kind: MetricKind;

    @ApiProperty({ example: 'kg' }) readonly unit: string;

    @ApiProperty({
        nullable: true,
        description: 'The latest reading, however old — null when there has never been one.',
    })
    readonly current: number | null;

    @ApiProperty({ nullable: true, description: 'The first reading ever taken; null on a daily metric.' })
    readonly initial: number | null;

    @ApiProperty({ nullable: true, description: 'Target weight, or the daily goal for a daily metric.' })
    readonly goal: number | null;

    @ApiProperty({ nullable: true, description: 'Upper end of the healthy range, where one is published.' })
    readonly recommendedMax: number | null;

    @ApiProperty({ type: [ProgressPointView], description: 'Oldest first, so a chart reads left to right.' })
    readonly points: ProgressPointView[];

    private constructor(card: ProgressCard) {
        this.metric = card.metric;
        this.kind = card.kind;
        this.unit = card.unit;
        this.current = card.current;
        this.goal = card.goal;
        this.initial = card.kind === MetricKind.OneOff ? card.initial : null;
        this.recommendedMax = card.kind === MetricKind.OneOff ? card.recommendedMax : null;
        this.points =
            card.kind === MetricKind.OneOff
                ? // Measured readings arrive newest first, because that is the
                  // order the record list renders in; the chart wants the
                  // opposite, and reversing here keeps both honest.
                  [...card.points].reverse().map(point => ProgressPointView.from(point))
                : card.points.map(point => ProgressPointView.from(point));
    }

    static from(card: ProgressCard): ProgressCardView {
        return new ProgressCardView(card);
    }
}

/**
 * What the period adds up to.
 *
 * A measured metric answers «how high, how low, how typical»; a daily one
 * answers «how many days did I hit it» — different questions, so only one set
 * of fields is ever filled and `kind` on the card says which.
 */
export class ProgressSummaryView {
    @ApiProperty({ nullable: true }) readonly min: number | null;
    @ApiProperty({ nullable: true }) readonly avg: number | null;
    @ApiProperty({ nullable: true }) readonly max: number | null;

    @ApiProperty({ nullable: true, description: 'Days below the target band.' })
    readonly daysUnder: number | null;

    @ApiProperty({ nullable: true, description: 'Days inside it.' })
    readonly daysOnTarget: number | null;

    @ApiProperty({ nullable: true, description: 'Days above it.' })
    readonly daysOver: number | null;

    @ApiProperty({ nullable: true, description: 'Lower edge of the band that counts as on target.' })
    readonly lowerBound: number | null;

    @ApiProperty({ nullable: true }) readonly upperBound: number | null;

    private constructor(summary: OneOffSummary | DailyDistribution) {
        const oneOff = 'avg' in summary ? summary : null;
        const daily = 'onTarget' in summary ? summary : null;

        this.min = oneOff?.min ?? null;
        this.avg = oneOff?.avg ?? null;
        this.max = oneOff?.max ?? null;
        this.daysUnder = daily?.under ?? null;
        this.daysOnTarget = daily?.onTarget ?? null;
        this.daysOver = daily?.over ?? null;
        this.lowerBound = daily?.lowerBound ?? null;
        this.upperBound = daily?.upperBound ?? null;
    }

    static from(summary: OneOffSummary | DailyDistribution): ProgressSummaryView {
        return new ProgressSummaryView(summary);
    }
}

export class MetricDetailView {
    @ApiProperty({ type: ProgressCardView }) readonly card: ProgressCardView;

    @ApiProperty({
        type: ProgressSummaryView,
        nullable: true,
        description: 'Null while the period holds nothing to summarise.',
    })
    readonly summary: ProgressSummaryView | null;

    @ApiProperty({
        nullable: true,
        description: 'Current minus goal — negative means still to go on a metric being reduced.',
    })
    readonly difference: number | null;

    private constructor(detail: MetricDetail) {
        this.card = ProgressCardView.from(detail.card);
        this.summary = detail.summary ? ProgressSummaryView.from(detail.summary) : null;
        this.difference = detail.difference;
    }

    static from(detail: MetricDetail): MetricDetailView {
        return new MetricDetailView(detail);
    }
}

export class MeasurementView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;
    @ApiProperty({ enum: ProgressMetric }) readonly metric: string;
    @ApiProperty() readonly value: number;
    @ApiProperty({ example: '2026-09-06' }) readonly measuredOn: string;

    private constructor(measurement: BodyMeasurementEntity) {
        this.id = measurement.id;
        this.metric = measurement.metric;
        this.value = measurement.value;
        this.measuredOn = measurement.measuredOn;
    }

    static from(measurement: BodyMeasurementEntity): MeasurementView {
        return new MeasurementView(measurement);
    }
}
