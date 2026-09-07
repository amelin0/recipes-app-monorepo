import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { MetricsService } from './metrics.service';

/**
 * Requests that matched no route — scanners, typos — collapse into this one
 * label. Their raw paths would let any stranger create unbounded time series
 * in Prometheus just by hitting random URLs.
 */
const UNMATCHED_ROUTE = '<unmatched>';

/** Excluded so Prometheus does not end up measuring its own scrape. */
const IGNORED_PATHS = ['/metrics'];

/**
 * Middleware, deliberately, and not an interceptor.
 *
 * Nest runs middleware → guards → interceptors → handler, so an interceptor
 * only ever sees requests that reached a handler. Every 404, every 401 from
 * `JwtGuard` and every 429 from the throttler would be missing from the
 * histogram — precisely the responses worth alerting on. Middleware sits in
 * front of all of it and hooks `finish`, so the count is complete.
 */
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
    constructor(private readonly metricsService: MetricsService) {}

    use(req: Request, res: Response, next: NextFunction): void {
        if (IGNORED_PATHS.includes(req.path)) {
            next();
            return;
        }

        const startedAt = process.hrtime.bigint();

        // Registered before next() so it is attached even when a guard
        // short-circuits the chain; `finish` fires for every status code.
        res.once('finish', () => {
            const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;

            this.metricsService.httpRequestDuration.observe(
                { method: req.method, route: routePattern(req), status: String(res.statusCode) },
                durationSeconds,
            );
        });

        next();
    }
}

/**
 * `/api/v1/recipes/:id`, not `/api/v1/recipes/9f3c…`. Express fills
 * `req.route` only once a handler has matched, which is why unmatched
 * requests fall back to a constant instead of their own path.
 */
function routePattern(req: Request): string {
    const path = (req.route as { path?: string } | undefined)?.path;
    if (!path) return UNMATCHED_ROUTE;

    return `${req.baseUrl ?? ''}${path}` || path;
}
