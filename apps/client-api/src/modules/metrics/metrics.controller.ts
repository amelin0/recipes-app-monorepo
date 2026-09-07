import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';

import { MetricsService } from './metrics.service';

/**
 * The Prometheus scrape endpoint.
 *
 * Served at `/metrics`, **outside** the `api/v1` prefix — that is where every
 * scrape config looks by default. It is excluded from the prefix in `main.ts`.
 *
 * ⚠️ Nothing guards it. Prometheus reaches it over the internal compose
 * network, so nginx **must** deny `/metrics` on the public vhost; otherwise
 * route names, traffic volumes and runtime internals are world-readable.
 * See `infra/prod/nginx/client-api.conf.example`.
 *
 * Written with `@Res` because the payload is Prometheus text exposition
 * format, not JSON: the global `ResponseInterceptor` would wrap it in
 * `{ data }` and break every parser.
 */
@ApiExcludeController()
@Controller('metrics')
export class MetricsController {
    constructor(private readonly metricsService: MetricsService) {}

    @Get()
    async scrape(@Res() res: Response): Promise<void> {
        res.header('Content-Type', this.metricsService.contentType());
        res.send(await this.metricsService.scrape());
    }
}
