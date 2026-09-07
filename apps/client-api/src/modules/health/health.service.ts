import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';

import { DATABASE_CONNECTION, DrizzleDB } from '@dns/database';

import { DependencyView } from './readiness.view';

/**
 * How long a dependency gets to answer before it counts as down.
 *
 * A readiness probe that waits as long as the driver would is worse than no
 * probe: the health check hangs exactly when the thing it watches is stuck.
 */
const PROBE_TIMEOUT_MS = 2000;

@Injectable()
export class HealthService {
    constructor(@Inject(DATABASE_CONNECTION) private readonly db: DrizzleDB) {}

    /**
     * What this process needs in order to serve, actually asked.
     *
     * Redis is deliberately absent: it runs in the compose file but no code
     * reads it — the throttler keeps its counters in process memory. Probing
     * something the app does not use would report a failure that changes
     * nothing.
     */
    async dependencies(): Promise<DependencyView[]> {
        return [await this.probe('database', () => this.db.execute(sql`select 1`))];
    }

    private async probe(name: string, run: () => Promise<unknown>): Promise<DependencyView> {
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`timed out after ${PROBE_TIMEOUT_MS}ms`)), PROBE_TIMEOUT_MS).unref(),
        );

        try {
            await Promise.race([run(), timeout]);
            return DependencyView.from(name, true, null);
        } catch (error) {
            return DependencyView.from(name, false, error instanceof Error ? error.message : 'unknown error');
        }
    }
}
