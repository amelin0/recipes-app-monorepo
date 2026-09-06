import { Inject } from '@nestjs/common';

import { DATABASE_CONNECTION, DrizzleDB } from '../connection';

export type { DrizzleDB };

/**
 * Every domain repository extends this and returns Entity instances —
 * never raw rows. Services therefore never see a Drizzle result shape,
 * which is what keeps a schema change from leaking into controllers.
 */
export abstract class BaseRepository {
    constructor(@Inject(DATABASE_CONNECTION) protected readonly db: DrizzleDB) {}
}
