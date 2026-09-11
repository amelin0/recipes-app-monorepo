import { Inject } from '@nestjs/common';

import { DATABASE_CONNECTION, DrizzleDB } from '../connection';

export type { DrizzleDB };

/**
 * The query surface a connection and a transaction handle share. Helpers that
 * must run inside a caller's transaction take this, so the same statement
 * serves both a standalone call and one step of a larger unit of work.
 */
export type DrizzleExecutor = Pick<DrizzleDB, 'select' | 'insert' | 'update' | 'delete'>;

/**
 * Every domain repository extends this and returns Entity instances —
 * never raw rows. Services therefore never see a Drizzle result shape,
 * which is what keeps a schema change from leaking into controllers.
 */
export abstract class BaseRepository {
    constructor(@Inject(DATABASE_CONNECTION) protected readonly db: DrizzleDB) {}
}
