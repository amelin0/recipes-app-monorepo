import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';

import { ADMIN_AUTH_POLICY } from '@dns/constants';
import { AdminEntity, AdminRefreshTokenRepository, PreparedAdminRefreshToken } from '@dns/database';

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
    ) {}

    /**
     * Opens a new browser chain on sign-in.
     *
     * `null` when the account can no longer sign in by the time the row is
     * written: sign-in checked `is_active` before bcrypt, and a deactivation
     * landing in those ~250 ms must win. The returned `admin` is the row as
     * read under that lock, so the access token carries what is true now.
     */
    async openSession(adminId: string): Promise<AdminTokenPairWithAdmin | null> {
        const successor = await this.prepareRefreshToken(adminId);

        const admin = await this.refreshTokenRepository.openChain(adminId, randomUUID(), successor.row);
        if (!admin) return null;

        return { accessToken: await this.signAccessToken(admin), refreshToken: successor.token, admin };
    }

    /**
     * Exchanges a refresh token for a new pair, keeping the browser's chain.
     *
     * The slow, stateless work — signature, digest comparison, hashing the
     * successor — happens first, with no lock and no transaction. The decision
     * itself is one repository call that owns its transaction, so nothing read
     * here is trusted by the time it is written (see
     * `AdminRefreshTokenRepository.rotate`).
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
        // victim's live chain at will. The digest never changes, so comparing
        // against a copy read outside the transaction is sound.
        if (!(await compare(refreshToken, stored.tokenHash))) throw invalidRefreshTokenException();

        // Minted even if the rotation then refuses: hashing it inside the
        // transaction would hold the admin row lock through ~250 ms of bcrypt.
        //
        // A grace sibling is a *second* live pair for the chain, not a copy of
        // the winner's — we store only a digest and cannot reproduce a token
        // we already issued.
        const successor = await this.prepareRefreshToken(stored.adminId);

        const result = await this.refreshTokenRepository.rotate({
            presentedId: stored.id,
            adminId: stored.adminId,
            graceSeconds: ADMIN_AUTH_POLICY.refreshRotationGraceSeconds,
            successor: successor.row,
        });

        if (result.outcome !== 'rotated' && result.outcome !== 'grace') throw invalidRefreshTokenException();

        return {
            accessToken: await this.signAccessToken(result.admin),
            refreshToken: successor.token,
            admin: result.admin,
        };
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

        await this.refreshTokenRepository.deleteFamily(stored.adminId, stored.familyId);
    }

    /**
     * Every session of one account — sign-out-everywhere (FR-007).
     * Deactivation revokes inside `AdminRepository.updateAccess` instead, in
     * the same transaction that flips the flag.
     */
    revokeAllForAdmin(adminId: string): Promise<void> {
        return this.refreshTokenRepository.deleteAllForAdmin(adminId);
    }

    /**
     * Signs and hashes a refresh token whose row does not exist yet. The row
     * id must be chosen before signing: it travels inside the token as `jti`.
     */
    private async prepareRefreshToken(adminId: string): Promise<{ token: string; row: PreparedAdminRefreshToken }> {
        const id = randomUUID();
        const token = await this.signRefreshToken(adminId, id);

        return {
            token,
            row: {
                id,
                tokenHash: await hash(token, ADMIN_AUTH_POLICY.bcryptRounds),
                expiresAt: this.refreshExpiresAt(),
            },
        };
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
            // Past the revocation marker even when it was set in this same
            // second — see `session-marker.ts`. `exp` is counted from it.
            iat: admin.accessTokenIssuedAt(),
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
