import { randomUUID } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';

import { AUTH_POLICY } from '@dns/constants';
import { RefreshTokenRepository, UserEntity, UserRepository } from '@dns/database';
import { AuthTokens } from '@dns/shared-types';

import { AllConfig } from '../../common/config';

import { AuthErrorCode } from './auth.errors';
import { AccessTokenPayload, RefreshTokenPayload } from './auth.types';

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService<AllConfig>,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly userRepository: UserRepository,
    ) {}

    /**
     * Mints a token pair and opens (or continues) one device's chain.
     *
     * `familyId` is omitted on a fresh sign-in and carried over on rotation —
     * that is what keeps devices independent (session FR-006) while still
     * letting one compromised chain be revoked whole.
     */
    async issuePair(user: UserEntity, familyId: string = randomUUID()): Promise<AuthTokens> {
        const accessToken = await this.signAccessToken(user);

        // The row id has to exist before the token is signed, because it
        // travels inside it as `jti`.
        const tokenId = randomUUID();
        const expiresAt = this.refreshExpiresAt();
        const refreshToken = await this.signRefreshToken(user.id, tokenId);

        await this.refreshTokenRepository.create({
            id: tokenId,
            userId: user.id,
            familyId,
            tokenHash: await hash(refreshToken, AUTH_POLICY.bcryptRounds),
            expiresAt,
        });

        return { accessToken, refreshToken };
    }

    /**
     * Exchanges a refresh token for a new pair, keeping the device's chain.
     *
     * Every rejection is the same 401: telling a caller *why* a token failed
     * would say whether the id exists and whether it was already spent.
     */
    async rotate(refreshToken: string): Promise<AuthTokens> {
        const payload = await this.verifyRefreshToken(refreshToken).catch(() => {
            throw this.invalidRefreshToken();
        });

        if (payload.type !== 'refresh') throw this.invalidRefreshToken();

        const stored = await this.refreshTokenRepository.findById(payload.jti);
        if (!stored) throw this.invalidRefreshToken();

        // Before the replay check: a token whose signature is valid but whose
        // body does not match the stored digest was minted by someone holding
        // the refresh secret, not handed out by us. Treating that as a replay
        // would let an attacker revoke a victim's live chain at will.
        if (!(await compare(refreshToken, stored.tokenHash))) throw this.invalidRefreshToken();

        // The genuine token, presented a second time. Only theft explains
        // that, so the whole chain goes — and only that chain, leaving the
        // user's other devices signed in (session FR-006).
        if (stored.isRotated()) {
            await this.refreshTokenRepository.deleteFamily(stored.familyId);
            throw this.invalidRefreshToken();
        }

        if (stored.isExpired()) throw this.invalidRefreshToken();

        const user = await this.userRepository.findById(stored.userId);
        if (!user || !user.isEmailVerified()) throw this.invalidRefreshToken();

        await this.refreshTokenRepository.markRotated(stored.id);

        return this.issuePair(user, stored.familyId);
    }

    /**
     * Ends one device's session. Answers the same way whether or not the token
     * was valid — a caller signing out has nothing to gain from being told.
     */
    async revokeChain(refreshToken: string): Promise<void> {
        const payload = await this.verifyRefreshToken(refreshToken).catch(() => null);
        if (!payload) return;

        const stored = await this.refreshTokenRepository.findById(payload.jti);
        if (!stored) return;

        await this.refreshTokenRepository.deleteFamily(stored.familyId);
    }

    /** Signs every device out — "log out everywhere", and after a password change (session FR-007). */
    revokeAllForUser(userId: string): Promise<void> {
        return this.refreshTokenRepository.deleteAllForUser(userId);
    }

    private invalidRefreshToken(): UnauthorizedException {
        return new UnauthorizedException({
            message: 'Invalid refresh token',
            code: AuthErrorCode.InvalidRefreshToken,
        });
    }

    verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
        return this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
            secret: this.configService.getOrThrow('auth.refresh.secret', { infer: true }),
        });
    }

    private signAccessToken(user: UserEntity): Promise<string> {
        const payload: AccessTokenPayload = { sub: user.id, email: user.email };

        return this.jwtService.signAsync(payload, {
            secret: this.configService.getOrThrow('auth.access.secret', { infer: true }),
            expiresIn: this.configService.getOrThrow('auth.access.expiresIn', { infer: true }),
        });
    }

    private signRefreshToken(userId: string, tokenId: string): Promise<string> {
        const payload: RefreshTokenPayload = { sub: userId, jti: tokenId, type: 'refresh' };

        return this.jwtService.signAsync(payload, {
            secret: this.configService.getOrThrow('auth.refresh.secret', { infer: true }),
            expiresIn: this.configService.getOrThrow('auth.refresh.expiresIn', { infer: true }),
        });
    }

    /**
     * The row's own expiry, kept in step with the JWT's. Both exist because
     * either alone is insufficient: the claim is what the client checks, the
     * column is what a cleanup job and the replay check read.
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
