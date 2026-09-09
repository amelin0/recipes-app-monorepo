import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';

import { HealthService } from './health.service';
import { HealthView } from './health.view';
import { ReadinessView } from './readiness.view';

// Probes are exempt from the rate limit, and that is not a convenience.
// They share a tracker key — they come from the load balancer and the
// monitoring host rather than from a user — so nginx, blackbox-exporter and
// the container health check all draw on the same 60/min budget. The failure
// that produces is perverse: the probe starts getting 429, everything
// concludes the service is down, and the service was fine. Neither route
// touches anything expensive; readiness asks Postgres for `select 1`.
@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    /** Liveness. Deliberately touches nothing — it answers «is the process up», not «can it serve». */
    @Get()
    @ApiOkResponse({ type: HealthView })
    check(): HealthView {
        return HealthView.up();
    }

    /**
     * Readiness: the dependencies, actually asked.
     *
     * Separate from `/health` because that one answers `ok` with a dead
     * database — which is exactly the state a load balancer must not route
     * to. **503** when anything is down, so a probe can act on the status
     * code alone without parsing the body.
     */
    @Get('ready')
    @ApiOkResponse({ type: ReadinessView })
    @ApiServiceUnavailableResponse({ type: ReadinessView, description: 'A dependency is unreachable.' })
    async ready(@Res() res: Response): Promise<void> {
        const view = ReadinessView.from(await this.healthService.dependencies());
        const ok = view.status === 'ready';

        // @Res bypasses the global interceptor, so the envelope is written by
        // hand here to keep the shape every other endpoint has.
        res.status(ok ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({ data: view });
    }
}
