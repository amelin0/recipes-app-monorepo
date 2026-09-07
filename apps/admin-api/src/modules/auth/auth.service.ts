import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
    private readonly logger = new Logger(AdminAuthService.name);

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
        const lockedOut = await this.isLockedOut(email);

        // Runs on every path, including the two where the answer is already
        // decided. Skipping it when the account is unknown or locked out is
        // exactly the shortcut that leaks which addresses exist.
        const passwordMatches = await compare(input.password, admin?.passwordHash ?? this.dummyHash);

        if (lockedOut || !admin || !passwordMatches || !admin.canSignIn()) {
            await this.recordAttempt({ email, adminId: admin?.id ?? null, context, succeeded: false });
            throw invalidCredentialsException();
        }

        await this.recordAttempt({ email, adminId: admin.id, context, succeeded: true });
        await this.adminRepository.touchLastLogin(admin.id);

        const tokens = await this.tokenService.issuePair(admin);

        return { ...tokens, admin };
    }

    /**
     * Revokes an account (sign-in FR-008).
     *
     * Two steps, and the order matters: flip the flag first, so a refresh
     * arriving between the two statements finds an account that can no longer
     * sign in, rather than a live row whose tokens were just deleted.
     */
    async setActive(adminId: string, isActive: boolean): Promise<void> {
        await this.adminRepository.setActive(adminId, isActive);

        if (!isActive) {
            await this.tokenService.revokeAllForAdmin(adminId);
        }
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

    /**
     * Whether this address has burned through its attempts.
     *
     * Counted per address in the database, alongside — not instead of — the
     * throttler's per-IP limit. One stops a run against a single account from
     * anywhere; the other stops a run against many accounts from one place.
     * Neither covers the other's case.
     *
     * A locked-out address still gets `invalid credentials`, never «locked»:
     * naming the state would confirm the account exists.
     */
    private async isLockedOut(email: string): Promise<boolean> {
        const since = new Date(Date.now() - ADMIN_AUTH_POLICY.lockoutWindowMinutes * 60_000);
        const failures = await this.loginAttemptRepository.countFailuresSince(email, since);

        return failures >= ADMIN_AUTH_POLICY.maxFailedAttempts;
    }

    /**
     * The journal write must never be the reason a sign-in fails.
     *
     * A full disk or a locked table would otherwise lock every admin out of
     * the panel — the audit trail taking down the thing it audits. It is
     * logged at error level instead, because a silently missing trail is its
     * own kind of incident.
     */
    private async recordAttempt(params: {
        email: string;
        adminId: string | null;
        context: AttemptContext;
        succeeded: boolean;
    }): Promise<void> {
        try {
            await this.loginAttemptRepository.record({
                email: params.email,
                adminId: params.adminId,
                ip: params.context.ip,
                userAgent: params.context.userAgent,
                succeeded: params.succeeded,
            });
        } catch (error) {
            this.logger.error({ msg: 'failed to record admin login attempt', email: params.email, error });
        }
    }
}
