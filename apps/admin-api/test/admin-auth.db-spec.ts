import { UnauthorizedException } from '@nestjs/common';
import { sql } from 'drizzle-orm';

import {
    AdminEntity,
    AdminLoginAttemptRepository,
    AdminRefreshTokenRepository,
    AdminRepository,
    DrizzleDB,
} from '@dns/database';
import { AdminRole } from '@dns/shared-types';

import { AdminAuthService } from '../src/modules/auth/auth.service';
import { AdminTokenService } from '../src/modules/auth/token.service';

import { truncateAdminTables } from './support/db';
import { AdminTestContext, createAdminTestContext } from './support/testing-module';

const PASSWORD = 'correct-horse-1';
const CONTEXT = { ip: '203.0.113.7', userAgent: 'jest' };

describe('admin auth', () => {
    let context: AdminTestContext;
    let authService: AdminAuthService;
    let tokenService: AdminTokenService;
    let adminRepository: AdminRepository;
    let refreshTokenRepository: AdminRefreshTokenRepository;
    let loginAttemptRepository: AdminLoginAttemptRepository;

    beforeAll(async () => {
        context = await createAdminTestContext();
        authService = context.moduleRef.get(AdminAuthService);
        tokenService = context.moduleRef.get(AdminTokenService);
        adminRepository = context.moduleRef.get(AdminRepository);
        refreshTokenRepository = context.moduleRef.get(AdminRefreshTokenRepository);
        loginAttemptRepository = context.moduleRef.get(AdminLoginAttemptRepository);
    });

    afterAll(async () => {
        await truncateAdminTables(context.db);
        await context.close();
    });

    beforeEach(async () => {
        await truncateAdminTables(context.db);
    });

    const createAdmin = (overrides: Partial<{ email: string; role: AdminRole }> = {}): Promise<AdminEntity> =>
        authService.create({
            email: overrides.email ?? 'editor@rationfit.com',
            password: PASSWORD,
            fullName: 'Test Editor',
            role: overrides.role ?? AdminRole.Admin,
        });

    describe('login', () => {
        it('issues a pair and reports who signed in', async () => {
            const admin = await createAdmin();

            const result = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);

            expect(result.accessToken).toEqual(expect.any(String));
            expect(result.refreshToken).toEqual(expect.any(String));
            expect(result.admin.id).toBe(admin.id);
        });

        it('normalises the address, so casing cannot create a second account', async () => {
            await createAdmin({ email: 'editor@rationfit.com' });

            const result = await authService.login({ email: 'EDITOR@RationFit.com', password: PASSWORD }, CONTEXT);

            expect(result.admin.email).toBe('editor@rationfit.com');
        });

        it('rejects a wrong password', async () => {
            await createAdmin();

            await expect(
                authService.login({ email: 'editor@rationfit.com', password: 'wrong-password-1' }, CONTEXT),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('answers an unknown address exactly as it answers a wrong password', async () => {
            await createAdmin();

            const unknown = await authService
                .login({ email: 'nobody@rationfit.com', password: PASSWORD }, CONTEXT)
                .catch((error: UnauthorizedException) => error.getResponse());
            const wrong = await authService
                .login({ email: 'editor@rationfit.com', password: 'wrong-password-1' }, CONTEXT)
                .catch((error: UnauthorizedException) => error.getResponse());

            // The whole point of FR-003: a caller cannot tell the two apart,
            // so the login form is not a directory of who works here.
            expect(unknown).toEqual(wrong);
        });

        it('refuses a deactivated account, without saying so', async () => {
            const admin = await createAdmin();
            await authService.setActive(admin.id, false);

            const deactivated = await authService
                .login({ email: admin.email, password: PASSWORD }, CONTEXT)
                .catch((error: UnauthorizedException) => error.getResponse());
            const unknown = await authService
                .login({ email: 'nobody@rationfit.com', password: PASSWORD }, CONTEXT)
                .catch((error: UnauthorizedException) => error.getResponse());

            expect(deactivated).toEqual(unknown);
        });

        it('closes the door after five failures and reopens it for nobody, correct password included', async () => {
            const admin = await createAdmin();

            for (let attempt = 0; attempt < 5; attempt++) {
                await expect(
                    authService.login({ email: admin.email, password: 'wrong-password-1' }, CONTEXT),
                ).rejects.toThrow(UnauthorizedException);
            }

            await expect(authService.login({ email: admin.email, password: PASSWORD }, CONTEXT)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('journals both outcomes', async () => {
            const admin = await createAdmin();

            await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);
            await authService.login({ email: admin.email, password: 'wrong-password-1' }, CONTEXT).catch(() => null);

            const attempts = await loginAttemptRepository.findRecentByEmail(admin.email);

            expect(attempts).toHaveLength(2);
            expect(attempts.map(row => row.succeeded).sort()).toEqual([false, true]);
            expect(attempts[0]?.ip).toBe(CONTEXT.ip);
        });

        it('records an attempt against an address that has no account', async () => {
            await authService.login({ email: 'nobody@rationfit.com', password: PASSWORD }, CONTEXT).catch(() => null);

            const attempts = await loginAttemptRepository.findRecentByEmail('nobody@rationfit.com');

            // The FK is deliberately absent so exactly this row can exist.
            expect(attempts).toHaveLength(1);
            expect(attempts[0]?.adminId).toBeNull();
        });

        it('stamps last_login_at only on success', async () => {
            const admin = await createAdmin();
            expect(admin.lastLoginAt).toBeNull();

            await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);

            const reloaded = await adminRepository.findById(admin.id);
            expect(reloaded?.lastLoginAt).toBeInstanceOf(Date);
        });
    });

    describe('timing', () => {
        it('takes comparable time for a known and an unknown address', async () => {
            await createAdmin();

            const measure = async (email: string): Promise<number> => {
                const started = process.hrtime.bigint();
                await authService.login({ email, password: 'wrong-password-1' }, CONTEXT).catch(() => null);
                return Number(process.hrtime.bigint() - started) / 1e6;
            };

            // Warm up, so the first bcrypt of the run does not skew the sample.
            await measure('editor@rationfit.com');

            const known: number[] = [];
            const unknown: number[] = [];
            for (let round = 0; round < 5; round++) {
                known.push(await measure('editor@rationfit.com'));
                unknown.push(await measure('nobody@rationfit.com'));
            }

            const median = (values: number[]): number => [...values].sort((a, b) => a - b)[2] as number;
            const ratio = median(known) / median(unknown);

            // Generous on purpose: this is a shared, noisy machine and the
            // assertion that matters is order-of-magnitude. Without the dummy
            // hash the unknown path returns in under a millisecond against
            // ~250 ms, so a real regression fails this by a factor of 100 —
            // it does not squeak past a 2x band.
            expect(ratio).toBeGreaterThan(0.5);
            expect(ratio).toBeLessThan(2);
        });
    });

    describe('refresh', () => {
        it('rotates into a new pair', async () => {
            const admin = await createAdmin();
            const first = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);

            const second = await tokenService.rotate(first.refreshToken);

            expect(second.refreshToken).not.toBe(first.refreshToken);
            expect(second.admin.id).toBe(admin.id);
        });

        it('treats a replay inside the grace window as the two-tab race it usually is', async () => {
            const admin = await createAdmin();
            const first = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);

            await tokenService.rotate(first.refreshToken);
            // Same token again, immediately — the losing tab.
            const loser = await tokenService.rotate(first.refreshToken);

            expect(loser.refreshToken).toEqual(expect.any(String));
        });

        it('revokes the whole chain when a spent token comes back after the window', async () => {
            const admin = await createAdmin();
            const first = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);
            const second = await tokenService.rotate(first.refreshToken);

            // Age the spent row past the grace window rather than sleeping.
            await backdateRotation(context, first.refreshToken);

            await expect(tokenService.rotate(first.refreshToken)).rejects.toThrow(UnauthorizedException);

            // The token issued in between is dead too: the chain went, not
            // just the replayed row.
            await expect(tokenService.rotate(second.refreshToken)).rejects.toThrow(UnauthorizedException);
        });

        it('refuses a token belonging to a deactivated account', async () => {
            const admin = await createAdmin();
            const session = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);

            await authService.setActive(admin.id, false);

            await expect(tokenService.rotate(session.refreshToken)).rejects.toThrow(UnauthorizedException);
        });

        it('refuses a garbage token', async () => {
            await expect(tokenService.rotate('not-a-jwt')).rejects.toThrow(UnauthorizedException);
        });

        it('gives a spent token one sibling, not one per replay', async () => {
            const admin = await createAdmin();
            const first = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);

            const winner = await tokenService.rotate(first.refreshToken);
            await tokenService.rotate(first.refreshToken);

            // Still inside the window, but the allowance is spent: this is the
            // replay the window used to hand a fresh pair to, every time.
            await expect(tokenService.rotate(first.refreshToken)).rejects.toThrow(UnauthorizedException);

            // And it was treated as one — the chain went with it.
            await expect(tokenService.rotate(winner.refreshToken)).rejects.toThrow(UnauthorizedException);
            await expect(countRefreshRows(context, admin.id)).resolves.toBe(0);
        });
    });

    describe('refresh under concurrency', () => {
        it('lets two tabs refreshing one token at once both stay signed in', async () => {
            const admin = await createAdmin();
            const session = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);

            const [a, b] = await Promise.all([
                tokenService.rotate(session.refreshToken),
                tokenService.rotate(session.refreshToken),
            ]);

            expect(a.refreshToken).not.toBe(b.refreshToken);

            // One of them rotated the token, the other claimed its sibling —
            // decided by the row, not by which request read it first.
            const presented = await refreshTokenRepository.findById(jtiOf(session.refreshToken));
            expect(presented?.rotatedAt).toBeInstanceOf(Date);
            expect(presented?.graceUsedAt).toBeInstanceOf(Date);

            // Both pairs are live and independent.
            await expect(tokenService.rotate(a.refreshToken)).resolves.toBeDefined();
            await expect(tokenService.rotate(b.refreshToken)).resolves.toBeDefined();
        });

        it('never mints more than one rotation and one sibling, however many present the token', async () => {
            const admin = await createAdmin();
            const session = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);

            const results = await Promise.allSettled(
                Array.from({ length: 6 }, () => tokenService.rotate(session.refreshToken)),
            );

            const fulfilled = results.filter(result => result.status === 'fulfilled');
            const rejected = results.filter(result => result.status === 'rejected');

            // Before the fix all six succeeded: every presentation inside the
            // window was answered with a fresh pair.
            expect(fulfilled).toHaveLength(2);
            for (const result of rejected) {
                expect((result as PromiseRejectedResult).reason).toBeInstanceOf(UnauthorizedException);
            }

            // The third presentation is a replay by definition, so the chain
            // is gone — including the two pairs just handed out.
            await expect(countRefreshRows(context, admin.id)).resolves.toBe(0);
        });

        it.each([
            ['deactivation', (adminId: string, _token: string) => authService.setActive(adminId, false)],
            ['logout-all', (adminId: string, _token: string) => tokenService.revokeAllForAdmin(adminId)],
            ['logout', (_adminId: string, token: string) => tokenService.revokeChain(token)],
        ])('lets %s win over a refresh in flight', async (_name, revoke) => {
            // Rounds with the revocation fired at a spread of offsets across
            // the refresh's ~500 ms of bcrypt, so some rounds land it exactly
            // in the gap the old code had between spending the token and
            // storing the successor. The invariant is checked every round.
            for (let round = 0; round < 8; round++) {
                await truncateAdminTables(context.db);
                const admin = await createAdmin();
                const session = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);

                const refresh = tokenService.rotate(session.refreshToken).then(
                    pair => pair.refreshToken,
                    () => null,
                );
                await delay(round * 90);
                await revoke(admin.id, session.refreshToken);
                const successor = await refresh;

                // Whatever the order, the revocation has the last word: no
                // session row survives it, and a successor, if one was
                // issued, is already dead.
                await expect(countRefreshRows(context, admin.id)).resolves.toBe(0);
                if (successor) {
                    await expect(tokenService.rotate(successor)).rejects.toThrow(UnauthorizedException);
                }
            }
        });

        it('makes a refresh that waits behind a revocation see it', async () => {
            const admin = await createAdmin();
            const session = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);

            // Stand in for a revocation that has taken the admin row lock and
            // not committed yet, then let the refresh queue up behind it.
            let refresh!: Promise<unknown>;
            await context.db.transaction(async tx => {
                await tx.execute(sql`SELECT id FROM admins WHERE id = ${admin.id} FOR UPDATE`);

                refresh = tokenService.rotate(session.refreshToken).catch((error: unknown) => error);
                await waitUntilBlockedBy(context, tx);

                await tx.execute(sql`UPDATE admins SET is_active = false WHERE id = ${admin.id}`);
                await tx.execute(sql`DELETE FROM admin_refresh_tokens WHERE admin_id = ${admin.id}`);
            });

            await expect(refresh).resolves.toBeInstanceOf(UnauthorizedException);
            await expect(countRefreshRows(context, admin.id)).resolves.toBe(0);
        });

        it('does not open a session for an account deactivated during sign-in', async () => {
            const admin = await createAdmin();

            // The same stand-in, this time in front of the sign-in's session
            // write — which comes after ~250 ms of bcrypt on an `is_active`
            // it read before.
            let login!: Promise<unknown>;
            await context.db.transaction(async tx => {
                await tx.execute(sql`SELECT id FROM admins WHERE id = ${admin.id} FOR UPDATE`);

                login = authService
                    .login({ email: admin.email, password: PASSWORD }, CONTEXT)
                    .catch((error: unknown) => error);
                await waitUntilBlockedBy(context, tx);

                await tx.execute(sql`UPDATE admins SET is_active = false WHERE id = ${admin.id}`);
            });

            await expect(login).resolves.toBeInstanceOf(UnauthorizedException);
            await expect(countRefreshRows(context, admin.id)).resolves.toBe(0);
        });
    });

    describe('logout', () => {
        it('kills the chain it was given', async () => {
            const admin = await createAdmin();
            const session = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);

            await tokenService.revokeChain(session.refreshToken);

            await expect(tokenService.rotate(session.refreshToken)).rejects.toThrow(UnauthorizedException);
        });

        it('leaves the other browser signed in', async () => {
            const admin = await createAdmin();
            const browserA = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);
            const browserB = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);

            await tokenService.revokeChain(browserA.refreshToken);

            await expect(tokenService.rotate(browserB.refreshToken)).resolves.toBeDefined();
        });

        it('is silent about an invalid token', async () => {
            await expect(tokenService.revokeChain('not-a-jwt')).resolves.toBeUndefined();
        });

        it('logout-all ends every browser', async () => {
            const admin = await createAdmin();
            const browserA = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);
            const browserB = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);

            await tokenService.revokeAllForAdmin(admin.id);

            await expect(tokenService.rotate(browserA.refreshToken)).rejects.toThrow(UnauthorizedException);
            await expect(tokenService.rotate(browserB.refreshToken)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('deactivation', () => {
        it('drops the sessions as well as the flag', async () => {
            const admin = await createAdmin();
            const session = await authService.login({ email: admin.email, password: PASSWORD }, CONTEXT);

            // The row exists before, so its absence afterwards means something.
            await expect(refreshTokenRepository.findById(jtiOf(session.refreshToken))).resolves.not.toBeNull();

            await authService.setActive(admin.id, false);

            await expect(refreshTokenRepository.findById(jtiOf(session.refreshToken))).resolves.toBeNull();

            const reloaded = await adminRepository.findById(admin.id);
            expect(reloaded?.canSignIn()).toBe(false);
        });

        it('lets a reactivated admin back in', async () => {
            const admin = await createAdmin();
            await authService.setActive(admin.id, false);
            await authService.setActive(admin.id, true);

            await expect(authService.login({ email: admin.email, password: PASSWORD }, CONTEXT)).resolves.toBeDefined();
        });
    });

    describe('roles', () => {
        it('defaults to ADMIN and can be raised', async () => {
            const admin = await createAdmin();
            expect(admin.isSuperAdmin()).toBe(false);

            await adminRepository.setRole(admin.id, AdminRole.SuperAdmin);

            const reloaded = await adminRepository.findById(admin.id);
            expect(reloaded?.isSuperAdmin()).toBe(true);
        });
    });
});

/** The refresh-token row id, read straight out of the JWT's claims. */
function jtiOf(refreshToken: string): string {
    const [, payloadPart = ''] = refreshToken.split('.');
    return (JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as { jti: string }).jti;
}

/**
 * Moves a spent token's `rotated_at` back beyond the grace window, so the
 * replay branch can be tested without a real ten-second wait.
 */
async function backdateRotation(context: AdminTestContext, refreshToken: string): Promise<void> {
    await context.db.execute(
        sql`UPDATE admin_refresh_tokens SET rotated_at = now() - interval '1 hour' WHERE id = ${jtiOf(refreshToken)}`,
    );
}

/** Every session row the account holds, spent or live. */
async function countRefreshRows(context: AdminTestContext, adminId: string): Promise<number> {
    const [row] = await context.db.execute<{ total: number }>(
        sql`SELECT count(*)::int AS total FROM admin_refresh_tokens WHERE admin_id = ${adminId}`,
    );
    return row?.total ?? 0;
}

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Resolves once some other backend is waiting on a lock `tx` holds — the
 * moment a request under test has queued up behind it.
 *
 * Asks Postgres rather than sleeping: a fixed sleep either wastes seconds or,
 * on a slow machine, fires before the request has got that far and quietly
 * turns the test into one that checks nothing. Polls on a pooled connection
 * other than `tx`'s, which is busy holding the lock.
 */
async function waitUntilBlockedBy(context: AdminTestContext, tx: DrizzleDB): Promise<void> {
    const [holder] = await tx.execute<{ pid: number }>(sql`SELECT pg_backend_pid() AS pid`);
    const deadline = Date.now() + 10_000;

    while (Date.now() < deadline) {
        const [row] = await context.db.execute<{ waiting: number }>(
            sql`SELECT count(*)::int AS waiting FROM pg_stat_activity
                 WHERE ${holder?.pid ?? -1}::int = ANY (pg_blocking_pids(pid))`,
        );
        if ((row?.waiting ?? 0) > 0) return;
        await delay(20);
    }

    throw new Error('Nothing queued up behind the held lock within 10 s — the request under test never reached it');
}
