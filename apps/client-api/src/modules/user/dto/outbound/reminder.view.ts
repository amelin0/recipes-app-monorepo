import { ApiProperty } from '@nestjs/swagger';

import { UserReminderEntity } from '@dns/database';
import { ReminderType } from '@dns/shared-types';

export class ReminderView {
    @ApiProperty({ enum: ReminderType })
    readonly type: ReminderType;

    @ApiProperty()
    readonly enabled: boolean;

    @ApiProperty({
        nullable: true,
        example: '08:00',
        description: 'Wall-clock time. Meals only; null for the weigh-in.',
    })
    readonly time: string | null;

    @ApiProperty({ nullable: true, example: 14, description: 'Weigh-in cadence in days. Meals carry null.' })
    readonly periodicityDays: number | null;

    @ApiProperty({ nullable: true, description: 'When the weigh-in reminder next fires.' })
    readonly nextFireAt: string | null;

    private constructor(reminder: UserReminderEntity) {
        this.type = reminder.type;
        this.enabled = reminder.enabled;
        // Postgres hands back `HH:mm:ss`; the screen shows hours and minutes,
        // and seconds are always zero here.
        this.time = reminder.timeOfDay?.slice(0, 5) ?? null;
        this.periodicityDays = reminder.periodicityDays;
        this.nextFireAt = reminder.nextFireAt?.toISOString() ?? null;
    }

    static from(reminder: UserReminderEntity): ReminderView {
        return new ReminderView(reminder);
    }
}
