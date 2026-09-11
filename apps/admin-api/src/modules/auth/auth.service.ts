import { Injectable, OnModuleInit } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

import { ADMIN_AUTH_POLICY } from '@dns/constants';
import { AdminEntity, AdminLoginAttemptRepository, AdminRepository } from '@dns/database';
import { AdminRole } from '@dns/shared-types';
import { AdminLoginInput } from '@dns/validation';

import { invalidCredentialsException } from './auth.errors';
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
     * Revokes an account (sign-in FR-008). The flag and the account's refresh
     * tokens change in one locked transaction — see `AdminRepository.setActive`.
     */
    async setActive(adminId: string, isActive: boolean): Promise<void> {
        await this.adminRepository.setActive(adminId, isActive);
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
