import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth';

import { HealthView } from './health.view';

// `@Public()` on the class, not the method: the service is deny-by-default
// (see the global guards in app.module.ts), and a probe that needs a bearer
// token is a probe that reports the service down for the wrong reason.
@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
    /** Liveness probe. Deliberately touches nothing — it answers "is the process up", not "is the database reachable". */
    @Get()
    @ApiOkResponse({ type: HealthView })
    check(): HealthView {
        return HealthView.up();
    }
}
