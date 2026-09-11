/**
 * SQLSTATE codes the application reacts to. Everything else stays a 500.
 *
 * @see https://www.postgresql.org/docs/16/errcodes-appendix.html
 */
export const PgErrorCode = {
    UniqueViolation: '23505',
    ForeignKeyViolation: '23503',
} as const;

export type PgErrorCode = (typeof PgErrorCode)[keyof typeof PgErrorCode];

interface PostgresErrorShape {
    code: string;
    severity: string;
    constraint_name?: string;
}

/**
 * Finds the driver's error in the cause chain.
 *
 * Drizzle wraps what postgres-js throws in a `DrizzleQueryError` whose message
 * is the failed SQL *with its parameters* — a password hash included — so the
 * wrapper must never be logged or answered as is. The driver error one level
 * down carries the SQLSTATE. `severity` is the tell that it is a server error
 * and not a Node system error, whose `code` (`EPIPE`) can look the same.
 */
function findPostgresError(error: unknown): PostgresErrorShape | null {
    let current: unknown = error;

    for (let depth = 0; depth < 5 && typeof current === 'object' && current !== null; depth++) {
        const candidate = current as Partial<PostgresErrorShape> & { cause?: unknown };
        if (typeof candidate.code === 'string' && typeof candidate.severity === 'string') {
            return candidate as PostgresErrorShape;
        }
        current = candidate.cause;
    }

    return null;
}

/** The SQLSTATE of a failed query, or null when the error did not come from Postgres. */
export function pgErrorCode(error: unknown): string | null {
    return findPostgresError(error)?.code ?? null;
}

/**
 * The constraint a violation tripped. For logs only — naming it in a response
 * would describe the schema to whoever sent the request.
 */
export function pgConstraintName(error: unknown): string | null {
    return findPostgresError(error)?.constraint_name ?? null;
}

/** A unique index said no — typically because a concurrent request inserted the same row first. */
export function isUniqueViolation(error: unknown): boolean {
    return pgErrorCode(error) === PgErrorCode.UniqueViolation;
}
