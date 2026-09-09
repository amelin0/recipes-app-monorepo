import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../auth';

import { HealthView } from './health.view';

// `@Public()` on the class, not the method: the service is deny-by-default
// (see the global guards in app.module.ts), and a probe that needs a bearer
// token is a probe that reports the service down for the wrong reason.
//
// `@SkipThrottle()` for the same reason one step further. Probes share a
// tracker key — they arrive from the load balancer and the monitoring host,
// not from a user — so the load balancer, blackbox-exporter and a health check
// all spend the same 60/min budget. The failure that produces is perverse: the
// probe starts getting 429, everything concludes the service is down, and the
// service was fine.
@ApiTags('health')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
    /** Liveness probe. Deliberately touches nothing — it answers "is the process up", not "is the database reachable". */
    @Get()
    @ApiOkResponse({ type: HealthView })
    check(): HealthView {
        return HealthView.up();
    }
}
