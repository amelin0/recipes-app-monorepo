import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { HealthView } from './health.view';

@ApiTags('health')
@Controller('health')
export class HealthController {
    /** Liveness probe. Deliberately touches nothing — it answers "is the process up", not "is the database reachable". */
    @Get()
    @ApiOkResponse({ type: HealthView })
    check(): HealthView {
        return HealthView.up();
    }
}
