import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';

import { ADMIN_AUTH_POLICY } from '@dns/constants';
import { AdminEntity, AdminRefreshTokenRepository, AdminRepository } from '@dns/database';

import { AllConfig } from '../../common/config';

import { invalidRefreshTokenException } from './auth.errors';
import { AdminAccessTokenPayload, AdminRefreshTokenPayload } from './auth.types';

export interface AdminTokenPair {
    accessToken: string;
    refreshToken: string;
}

/** A pair plus whose it is — what both sign-in and refresh hand back. */
export interface AdminTokenPairWithAdmin extends AdminTokenPair {
    admin: AdminEntity;
}

@Injectable()
export class AdminTokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService<AllConfig>,
        private readonly refreshTokenRepository: AdminRefreshTokenRepository,
        private readonly adminRepository: AdminRepository,
    ) {}

    /**
     * Mints a pair and opens (or continues) one browser's chain.
     *
     * `familyId` is omitted on a fresh sign-in and carried over on rotation —
     * that is what keeps browsers independent while still letting one
     * compromised chain be revoked whole.
     */
    async issuePair(admin: AdminEntity, familyId: string = randomUUID()): Promise<AdminTokenPair> {
        const accessToken = await this.signAccessToken(admin);

        // The row id must exist before the token is signed: it travels inside
        // it as `jti`.
        const tokenId = randomUUID();
        const refreshToken = await this.signRefreshToken(admin.id, tokenId);

        await this.refreshTokenRepository.create({
            id: tokenId,
            adminId: admin.id,
            familyId,
            tokenHash: await hash(refreshToken, ADMIN_AUTH_POLICY.bcryptRounds),
            expiresAt: this.refreshExpiresAt(),
        });

        return { accessToken, refreshToken };
    }

    /**
     * Exchanges a refresh token for a new pair, keeping the browser's chain.
     *
     * Every rejection is the same 401: saying *why* would reveal whether the
     * id exists and whether it was already spent.
     */
    async rotate(refreshToken: string): Promise<AdminTokenPairWithAdmin> {
        const payload = await this.verifyRefreshToken(refreshToken).catch(() => null);
        if (!payload || payload.type !== 'refresh') throw invalidRefreshTokenException();

        const stored = await this.refreshTokenRepository.findById(payload.jti);
        if (!stored) throw invalidRefreshTokenException();

        // Before the replay check, and the order matters: a token whose
        // signature verifies but whose body does not match the stored digest
        // was minted by someone holding the refresh secret, not handed out by
        // us. Treating that as a replay would let an attacker revoke a
        // victim's live chain at will.
        if (!(await compare(refreshToken, stored.tokenHash))) throw invalidRefreshTokenException();

        if (stored.isRotated()) {
            // Two tabs refreshed at the same instant. The loser is holding the
            // same genuine token, not a stolen one, so it gets its own pair on
            // the same chain rather than signing the admin out mid-edit.
            //
            // Note this hands out a *second* live pair for the chain, not a
            // copy of the winner's — we store only a digest and cannot
            // reproduce a token we already issued.
            if (stored.isWithinRotationGrace(ADMIN_AUTH_POLICY.refreshRotationGraceSeconds * 1000)) {
                const admin = await this.adminRepository.findById(stored.adminId);
                if (!admin?.canSignIn()) throw invalidRefreshTokenException();
                return { ...(await this.issuePair(admin, stored.familyId)), admin };
            }

            // Past the window, only theft explains it. The whole chain goes —
            // and only that chain, leaving other browsers signed in.
            await this.refreshTokenRepository.deleteFamily(stored.familyId);
            throw invalidRefreshTokenException();
        }

        if (stored.isExpired()) throw invalidRefreshTokenException();

        const admin = await this.adminRepository.findById(stored.adminId);
        // Deactivation revokes refresh rows too, so this is a second line of
        // defence rather than the only one — it also covers a row that
        // survived a partial failure.
        if (!admin || !admin.canSignIn()) throw invalidRefreshTokenException();

        await this.refreshTokenRepository.markRotated(stored.id);

        return { ...(await this.issuePair(admin, stored.familyId)), admin };
    }

    /**
     * Ends one browser's session. Answers the same way whether or not the
     * token was valid — a caller signing out has nothing to gain from being
     * told, and `logout` is the one route a stale tab is most likely to hit.
     */
    async revokeChain(refreshToken: string): Promise<void> {
        const payload = await this.verifyRefreshToken(refreshToken).catch(() => null);
        if (!payload) return;

        const stored = await this.refreshTokenRepository.findById(payload.jti);
        if (!stored) return;

        await this.refreshTokenRepository.deleteFamily(stored.familyId);
    }

    /** Every session of one account — sign-out-everywhere and deactivation (FR-008). */
    revokeAllForAdmin(adminId: string): Promise<void> {
        return this.refreshTokenRepository.deleteAllForAdmin(adminId);
    }

    verifyRefreshToken(token: string): Promise<AdminRefreshTokenPayload> {
        return this.jwtService.verifyAsync<AdminRefreshTokenPayload>(token, {
            secret: this.configService.getOrThrow('auth.refresh.secret', { infer: true }),
        });
    }

    private signAccessToken(admin: AdminEntity): Promise<string> {
        const payload: AdminAccessTokenPayload = {
            sub: admin.id,
            email: admin.email,
            // Carried for convenience and logging only. Authorisation reads
            // the row, not this claim — see AdminJwtStrategy.
            role: admin.role,
            type: 'access',
        };

        return this.jwtService.signAsync(payload, {
            secret: this.configService.getOrThrow('auth.access.secret', { infer: true }),
            expiresIn: this.configService.getOrThrow('auth.access.expiresIn', { infer: true }),
        });
    }

    private signRefreshToken(adminId: string, tokenId: string): Promise<string> {
        const payload: AdminRefreshTokenPayload = { sub: adminId, jti: tokenId, type: 'refresh' };

        return this.jwtService.signAsync(payload, {
            secret: this.configService.getOrThrow('auth.refresh.secret', { infer: true }),
            expiresIn: this.configService.getOrThrow('auth.refresh.expiresIn', { infer: true }),
        });
    }

    /**
     * The row's own expiry, kept in step with the JWT's. Both exist because
     * either alone is insufficient: the claim is what the client checks, the
     * column is what the replay check and a cleanup job read.
     */
    private refreshExpiresAt(): Date {
        const expiresIn = this.configService.getOrThrow('auth.refresh.expiresIn', { infer: true });
        return new Date(Date.now() + parseDuration(expiresIn));
    }
}

const DURATION_UNITS: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
};

/**
 * Parses the same `15m` / `30d` shorthand `@nestjs/jwt` accepts, so the row
 * expiry and the token claim are driven by one env value instead of drifting
 * apart in two.
 */
export function parseDuration(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (!match) {
        throw new Error(`Unsupported duration: "${value}" (expected e.g. 15m, 30d)`);
    }

    const [, amount, unit] = match;
    return Number(amount) * (DURATION_UNITS[unit as string] as number);
}
