import { ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

import { ADMIN_AUTH_POLICY } from '@dns/constants';
import { AdminAccessChange, AdminEntity, AdminLoginAttemptRepository, AdminRepository } from '@dns/database';
import { AdminRole } from '@dns/shared-types';
import { AdminLoginInput } from '@dns/validation';

import { AdminAuthErrorCode, invalidCredentialsException } from './auth.errors';
import { AttemptContext } from './auth.types';
import { AdminTokenPair, AdminTokenService } from './token.service';

export interface AdminSignInResult extends AdminTokenPair {
    admin: AdminEntity;
}

@Injectable()
export class AdminAuthService implements OnModuleInit {
    /**
     * A real bcrypt hash of a value nobody knows, compared against when the
     * address has no account.
     *
     * Without it, an unknown email returns in under a millisecond while a
     * known one pays ~250 ms of bcrypt — and the login form becomes a
     * directory of who works here, whatever the response body says
     * (sign-in FR-003, SC-002).
     */
    private dummyHash = '';

    constructor(
        private readonly adminRepository: AdminRepository,
        private readonly loginAttemptRepository: AdminLoginAttemptRepository,
        private readonly tokenService: AdminTokenService,
    ) {}

    /** Computed once at boot rather than per request: at cost 12 it is not cheap. */
    async onModuleInit(): Promise<void> {
        this.dummyHash = await hash('no-such-account', ADMIN_AUTH_POLICY.bcryptRounds);
    }

    /**
     * The single sign-in path.
     *
     * Every failure — unknown address, wrong password, deactivated account,
     * too many recent attempts — leaves through the same exception and takes
     * roughly the same time. That symmetry is the feature; the individual
     * checks are just how it is arrived at.
     */
    async login(input: AdminLoginInput, context: AttemptContext): Promise<AdminSignInResult> {
        // The schema lower-cases; this is belt and braces for any caller that
        // reaches the service directly, e.g. a test.
        const email = input.email.toLowerCase();

        const admin = await this.adminRepository.findByEmail(email);

        // Journalled as a failure *before* the password is looked at, and
        // counted with itself included — so a burst of parallel guesses cannot
        // all see «fewer than five» (see `AdminLoginAttemptRepository.openAttempt`).
        //
        // Counted per address in the database, alongside — not instead of —
        // the throttler's per-IP limit. One stops a run against a single
        // account from anywhere; the other stops a run against many accounts
        // from one place. Neither covers the other's case.
        //
        // Not wrapped in a try/catch any more: this row is the lockout
        // counter, not just the audit trail, and swallowing its failure would
        // turn «the journal is down» into «the lockout is off». A database
        // that cannot take this insert cannot store the session either.
        const attempt = await this.loginAttemptRepository.openAttempt(
            {
                email,
                adminId: admin?.id ?? null,
                ip: context.ip,
                userAgent: context.userAgent,
            },
            ADMIN_AUTH_POLICY.lockoutWindowMinutes,
        );
        // A locked-out address still gets `invalid credentials`, never
        // «locked»: naming the state would confirm the account exists.
        const lockedOut = attempt.failures > ADMIN_AUTH_POLICY.maxFailedAttempts;

        // Runs on every path, including the two where the answer is already
        // decided. Skipping it when the account is unknown or locked out is
        // exactly the shortcut that leaks which addresses exist.
        const passwordMatches = await compare(input.password, admin?.passwordHash ?? this.dummyHash);

        if (lockedOut || !admin || !passwordMatches || !admin.canSignIn()) {
            throw invalidCredentialsException();
        }

        // Re-checks `is_active` under the admin row lock: a deactivation that
        // landed during bcrypt above must not be followed by a fresh session.
        // The attempt stays journalled as failed, which is what it was.
        const session = await this.tokenService.openSession(admin.id);
        if (!session) throw invalidCredentialsException();

        await this.loginAttemptRepository.markSucceeded(attempt.attemptId);
        await this.adminRepository.touchLastLogin(admin.id);

        return session;
    }

    /**
     * A SUPER_ADMIN changing another account's role or active state
     * (sign-in FR-008, FR-011).
     *
     * Two rules, and neither is checked here against rows read earlier —
     * both are decided inside `AdminRepository.updateAccess`, with every
     * active SUPER_ADMIN locked:
     *
     * - the change must leave at least one other active SUPER_ADMIN, or
     *   two of them demoting each other at once leave nobody who can manage
     *   staff short of a database console;
     * - the actor must still be an active SUPER_ADMIN when the rows are locked,
     *   not merely when the guard looked.
     *
     * `actorId: null` is the system path — provisioning and tests — and waives
     * only the second rule.
     */
    async updateAccess(targetId: string, change: AdminAccessChange, actorId: string | null): Promise<AdminEntity> {
        // Deactivating yourself, or demoting yourself, is how an organisation
        // ends up with no SUPER_ADMIN and no way back in short of a database
        // console. The rule is narrow on purpose: it stops the accident, not
        // the deliberate handover, which is done from the other account. A
        // comparison of two inputs, so it needs no lock.
        if (actorId !== null && targetId === actorId) {
            throw new ForbiddenException({
                message: 'You cannot change your own role or active state',
                code: AdminAuthErrorCode.Forbidden,
            });
        }

        const result = await this.adminRepository.updateAccess(targetId, change, actorId);

        switch (result.outcome) {
            case 'updated':
                return result.admin;
            case 'not-found':
                throw new NotFoundException({
                    message: 'No such staff account',
                    code: AdminAuthErrorCode.AdminNotFound,
                });
            case 'last-super-admin':
                throw new ConflictException({
                    message: 'At least one other active super admin must remain',
                    code: AdminAuthErrorCode.LastSuperAdmin,
                });
            case 'actor-not-allowed':
                throw new ForbiddenException({
                    message: 'Requires an active super admin',
                    code: AdminAuthErrorCode.Forbidden,
                });
        }
    }

    /**
     * Revokes or restores an account from the system path (sign-in FR-008).
     * The flag and the account's refresh tokens change in one locked
     * transaction — see `AdminRepository.updateAccess`.
     */
    async setActive(adminId: string, isActive: boolean): Promise<void> {
        await this.updateAccess(adminId, { isActive }, null);
    }

    /**
     * Provisions a staff account. Used by the seed and by SUPER_ADMIN; there
     * is no self-registration anywhere (sign-in FR-010).
     */
    async create(input: { email: string; password: string; fullName: string; role: AdminRole }): Promise<AdminEntity> {
        return this.adminRepository.create({
            email: input.email.toLowerCase(),
            passwordHash: await hash(input.password, ADMIN_AUTH_POLICY.bcryptRounds),
            fullName: input.fullName,
            role: input.role,
        });
    }
}
