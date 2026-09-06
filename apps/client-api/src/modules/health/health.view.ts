import { ApiProperty } from '@nestjs/swagger';

export class HealthView {
    @ApiProperty({ example: 'ok' })
    readonly status: string;

    @ApiProperty({ example: '2026-09-06T12:00:00.000Z' })
    readonly time: string;

    private constructor(status: string, time: string) {
        this.status = status;
        this.time = time;
    }

    static up(): HealthView {
        return new HealthView('ok', new Date().toISOString());
    }
}
