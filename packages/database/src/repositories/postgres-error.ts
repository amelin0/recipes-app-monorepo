/**
 * Whether `error` is Postgres refusing a row because of one particular unique
 * index or constraint.
 *
 * By name, not just by code: a repository that turns «duplicate» into a
 * domain error must not turn some other table's duplicate into the same one.
 *
 * Walks `cause`, because Drizzle wraps the driver's error in its own
 * (`DrizzleQueryError`) and a transaction may wrap it again.
 */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
    for (let current: unknown = error; current instanceof Error; current = current.cause) {
        const { code, constraint_name: name } = current as { code?: unknown; constraint_name?: unknown };
        if (code === '23505' && name === constraint) return true;
    }

    return false;
}
