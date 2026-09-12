import { randomUUID } from 'node:crypto';

import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';

import { AUTH_POLICY } from '@dns/constants';
import { NewRefreshToken, RefreshTokenRepository, UserEntity } from '@dns/database';
import { AuthTokens } from '@dns/shared-types';

import { AllConfig } from '../../common/config';

import { AuthErrorCode } from './auth.errors';
import { AccessTokenPayload, RefreshTokenPayload } from './auth.types';

/** A refresh token ready to store: the JWT for the client, the row for the database. */
interface MintedRefreshToken {
    token: string;
    row: NewRefreshToken;
}

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService<AllConfig>,
        private readonly refreshTokenRepository: RefreshTokenRepository,
    ) {}

    /**
     * Mints a token pair and opens a new chain — one device's session.
     *
     * The single choke point for every fresh session — sign-in, email
     * confirmation, OAuth. The block check that makes a block leave no way in
     * (admin user-directory FR-006) runs again under the account's lock when
     * the token is stored, so a block that commits after `user` was read still
     * wins.
     *
     * `expectedPasswordHash`: the hash a sign-in verified the password
     * against. If a password reset replaced it in the meantime, the session is
     * refused rather than opened with the old password.
     */
    async issuePair(
        user: UserEntity,
        { expectedPasswordHash }: { expectedPasswordHash?: string | null } = {},
    ): Promise<AuthTokens> {
        if (user.isBlocked()) throw this.accountBlocked();

        const refresh = await this.mintRefreshToken(user.id);

        const grant = await this.refreshTokenRepository.openSession({
            userId: user.id,
            familyId: randomUUID(),
            token: refresh.row,
            expectedPasswordHash,
        });

        switch (grant.outcome) {
            case 'granted':
                return { accessToken: await this.signAccessToken(grant.user), refreshToken: refresh.token };
            case 'blocked':
                throw this.accountBlocked();
            case 'refused':
                throw new UnauthorizedException({
                    message: 'Invalid email or password',
                    code: AuthErrorCode.InvalidCredentials,
                });
        }
    }

    /**
     * Exchanges a refresh token for a new pair, keeping the device's chain.
     *
     * Every rejection is the same 401: telling a caller *why* a token failed
     * would say whether the id exists and whether it was already spent.
     *
     * One exception, and it is not an enumeration hole: a blocked account
     * answers 403 `auth.account-blocked`. Whoever presents a genuine refresh
     * token has already proved the account is theirs, and a silent logout
     * would leave them reinstalling the app to fix something an install
     * cannot fix.
     *
     * Concurrency (see `RefreshTokenRepository.rotate`): of several refreshes
     * of one token exactly one rotates it; ONE more arriving within
     * `refreshRotationGraceSeconds` gets a sibling pair on the same chain —
     * the app firing two refreshes at once must not sign the user out — and
     * any further one is a replay that revokes the chain.
     */
    async rotate(refreshToken: string): Promise<AuthTokens> {
        const payload = await this.verifyRefreshToken(refreshToken).catch(() => {
            throw this.invalidRefreshToken();
        });

        if (payload.type !== 'refresh') throw this.invalidRefreshToken();

        const stored = await this.refreshTokenRepository.findById(payload.jti);
        if (!stored) throw this.invalidRefreshToken();

        // Before anything that writes: a token whose signature is valid but
        // whose body does not match the stored digest was minted by someone
        // holding the refresh secret, not handed out by us. Treating that as a
        // replay would let an attacker revoke a victim's live chain at will.
        // Outside the transaction on purpose — bcrypt under a row lock would
        // make every revocation of the account wait for it.
        if (!(await compare(refreshToken, stored.tokenHash))) throw this.invalidRefreshToken();

        // Minted up front for the same reason: the transaction only stores it,
        // and a refused rotation simply never hands it out.
        const child = await this.mintRefreshToken(stored.userId);

        const result = await this.refreshTokenRepository.rotate({
            tokenId: stored.id,
            userId: stored.userId,
            child: child.row,
            graceSeconds: AUTH_POLICY.refreshRotationGraceSeconds,
        });

        switch (result.outcome) {
            case 'rotated':
            case 'grace':
                return { accessToken: await this.signAccessToken(result.user), refreshToken: child.token };
            case 'blocked':
                throw this.accountBlocked();
            case 'replay':
            case 'refused':
                throw this.invalidRefreshToken();
        }
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

        await this.refreshTokenRepository.deleteFamily(stored.userId, stored.familyId);
    }

    /**
     * Signs every device out — "log out everywhere" (session FR-007). Wins over
     * a refresh in flight: see `RefreshTokenRepository`.
     */
    revokeAllForUser(userId: string): Promise<void> {
        return this.refreshTokenRepository.deleteAllForUser(userId);
    }

    private invalidRefreshToken(): UnauthorizedException {
        return new UnauthorizedException({
            message: 'Invalid refresh token',
            code: AuthErrorCode.InvalidRefreshToken,
        });
    }

    private accountBlocked(): ForbiddenException {
        return new ForbiddenException({
            message: 'This account has been blocked',
            code: AuthErrorCode.AccountBlocked,
        });
    }

    verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
        return this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
            secret: this.configService.getOrThrow('auth.refresh.secret', { infer: true }),
        });
    }

    /**
     * The row id has to exist before the token is signed, because it travels
     * inside it as `jti`.
     */
    private async mintRefreshToken(userId: string): Promise<MintedRefreshToken> {
        const id = randomUUID();
        const token = await this.signRefreshToken(userId, id);

        return {
            token,
            row: { id, tokenHash: await hash(token, AUTH_POLICY.bcryptRounds), expiresAt: this.refreshExpiresAt() },
        };
    }

    /**
     * `user` must be the row read when the session was granted: its revocation
     * marker decides `iat`. `jsonwebtoken` counts `exp` from a supplied `iat`,
     * so the token's lifetime stays the configured one.
     */
    private signAccessToken(user: UserEntity): Promise<string> {
        const payload: AccessTokenPayload = {
            sub: user.id,
            email: user.email,
            type: 'access',
            iat: user.accessTokenIssuedAt(),
        };

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
