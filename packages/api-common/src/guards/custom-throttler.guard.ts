import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerRequest, ThrottlerStorage } from '@nestjs/throttler';

import { THROTTLE_KEY } from '../decorators';
import { ThrottleRuleConfig } from '../throttler';

/**
 * Global rate limiter with per-route overrides.
 *
 * A route decorated with `@SetThrottleKey(ThrottleKey.Login)` gets that rule's
 * ttl/limit from config; everything else falls back to the global default.
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    constructor(
        options: ThrottlerModuleOptions,
        storageService: ThrottlerStorage,
        reflector: Reflector,
        private readonly configService: ConfigService,
    ) {
        super(options, storageService, reflector);
    }

    protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
        const { context } = requestProps;
        const throttleKey = this.resolveThrottleKey(context);

        if (throttleKey) {
            const rule = this.getRule(throttleKey);
            requestProps.limit = rule.limit;
            requestProps.ttl = rule.ttl;
        }

        const result = await super.handleRequest(requestProps);

        this.setRateLimitHeaders(context, requestProps);

        return result;
    }

    protected async getTracker(req: Record<string, unknown>): Promise<string> {
        const userId = this.extractUserIdFromJwt(req);
        if (userId) return `user:${userId}`;

        const headers = req.headers as Record<string, unknown> | undefined;
        const realIp = headers?.['x-real-ip'];
        if (typeof realIp === 'string') return realIp;

        return typeof req.ip === 'string' ? req.ip : 'unknown';
    }

    /**
     * Decodes the JWT without verifying it — the signature check happens later
     * in the auth guard. Throttling only needs a stable bucket key, and a
     * forged `sub` can do nothing but consume its own quota.
     */
    private extractUserIdFromJwt(req: Record<string, unknown>): string | null {
        const headers = req.headers as Record<string, unknown> | undefined;
        const authHeader = headers?.authorization;
        if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) return null;

        try {
            const payloadB64 = authHeader.slice(7).split('.')[1];
            if (!payloadB64) return null;

            const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as { sub?: unknown };
            return typeof payload.sub === 'string' ? payload.sub : null;
        } catch {
            return null;
        }
    }

    protected generateKey(context: ExecutionContext, suffix: string, _name: string): string {
        const throttleKey = this.resolveThrottleKey(context) ?? 'global';
        return `throttler:${throttleKey}:${suffix}`;
    }

    private resolveThrottleKey(context: ExecutionContext): string | undefined {
        return this.reflector.getAllAndOverride<string | undefined>(THROTTLE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
    }

    private getRule(key: string): ThrottleRuleConfig {
        return this.configService.getOrThrow<ThrottleRuleConfig>(`throttler.rules.${key}`);
    }

    private setRateLimitHeaders(context: ExecutionContext, requestProps: ThrottlerRequest): void {
        const { res } = this.getRequestResponse(context);
        const { limit, ttl } = requestProps;

        const remaining = Math.max(0, limit - 1);
        const resetTime = Math.ceil(Date.now() / 1000) + Math.ceil(ttl / 1000);

        res.header('X-RateLimit-Limit', String(limit));
        res.header('X-RateLimit-Remaining', String(remaining));
        res.header('X-RateLimit-Reset', String(resetTime));
    }
}
