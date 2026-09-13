/**
 * The two sides of `sessions_valid_from` — the account-wide marker that ends
 * every access token issued before it (client session FR-007, password-reset
 * FR-005, admin sign-in FR-007). Shared by `UserEntity` and `AdminEntity`,
 * whose markers mean exactly the same thing.
 *
 * `iat` counts WHOLE SECONDS; the marker has sub-second precision. Checking
 * and signing resolve that one ambiguous second in opposite directions, and
 * only the pair of them is correct:
 *
 *   checking — strict: a token whose second began before the marker is
 *              refused, so one minted just BEFORE a revocation cannot survive
 *              it;
 *   signing  — lifted: a token minted AFTER the marker is stamped with the
 *              first whole second past it, so it is not mistaken for an older
 *              one. Without this, «sign out everywhere, sign straight back
 *              in» handed out an access token that was dead on arrival.
 */

/**
 * How far ahead of this process's clock a marker may be and still be cleared.
 *
 * The marker is stamped by Postgres and `iat` by Node, so a marker slightly in
 * the future is ordinary skew. Lifting `iat` also moves `exp`, though, so the
 * lift is bounded: a clock minutes off yields a refused token — fail closed —
 * rather than access tokens that outlive their TTL.
 */
const MAX_LIFT_SECONDS = 5;

/** The `iat` to sign an access token with, `nowMs` being this process's clock. */
export function accessTokenIssuedAt(marker: Date | null, nowMs: number): number {
    const now = Math.floor(nowMs / 1_000);
    if (marker === null) return now;

    const clearing = Math.ceil(marker.getTime() / 1_000);
    if (clearing <= now) return now;

    return clearing - now <= MAX_LIFT_SECONDS ? clearing : now;
}

/**
 * Whether a token stamped `iatSeconds` still belongs to a live session. A
 * missing `iat` fails closed: every token we sign carries one.
 */
export function tokenIssuedAtIsAccepted(marker: Date | null, iatSeconds: number | undefined): boolean {
    if (marker === null) return true;
    if (iatSeconds === undefined) return false;

    return iatSeconds * 1_000 >= marker.getTime();
}
