import { Injectable } from '@nestjs/common';
import { Histogram, Registry, collectDefaultMetrics } from 'prom-client';

/**
 * Buckets in seconds, tuned for this API: most calls finish in tens of
 * milliseconds, and prom-client's defaults start too coarse to place a p95
 * that sits under 100 ms.
 */
const DURATION_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

@Injectable()
export class MetricsService {
    /**
     * A private registry rather than prom-client's global default. The global
     * one is process-wide shared state: it makes tests order-dependent and
     * double-registers on a hot reload.
     */
    private readonly registry = new Registry();

    readonly httpRequestDuration: Histogram<'method' | 'route' | 'status'>;

    constructor() {
        // Event loop lag, heap by space, GC pauses, RSS, CPU, active handles —
        // the Node health picture that logs cannot express by construction.
        collectDefaultMetrics({ register: this.registry });

        this.httpRequestDuration = new Histogram({
            name: 'http_request_duration_seconds',
            help: 'HTTP request duration in seconds',
            // `route` is the Express route **pattern**, never the raw URL —
            // see MetricsMiddleware. Raw URLs would make every recipe id its
            // own time series and eventually take Prometheus down.
            labelNames: ['method', 'route', 'status'] as const,
            buckets: DURATION_BUCKETS,
            registers: [this.registry],
        });
    }

    contentType(): string {
        return this.registry.contentType;
    }

    scrape(): Promise<string> {
        return this.registry.metrics();
    }
}
