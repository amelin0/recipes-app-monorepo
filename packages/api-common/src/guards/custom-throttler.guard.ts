import { ExecutionContext, Inject, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
    InjectThrottlerOptions,
    InjectThrottlerStorage,
    ThrottlerGuard,
    ThrottlerModuleOptions,
    ThrottlerRequest,
    ThrottlerStorage,
} from '@nestjs/throttler';

import { IS_PUBLIC, THROTTLE_KEY } from '../decorators';
import { THROTTLER_IDENTITY_VERIFIER, ThrottleRuleConfig, ThrottlerIdentityVerifier } from '../throttler';

/**
 * Global rate limiter with per-route overrides.
 *
 * A route decorated with `@SetThrottleKey(ThrottleKey.Login)` gets that rule's
 * ttl/limit from config; everything else falls back to the global default.
 *
 * Who a bucket belongs to (see `getTracker`) is decided only from things the
 * caller cannot choose freely: a token this service signed, or the address
 * our own nginx saw. Anything the caller can vary per request — an unsigned
 * `sub`, a header it sets itself — would let it open a fresh bucket for every
 * request, and the limit would limit nothing.
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    constructor(
        // Spelled out rather than inherited: the base class's tokens reach a
        // subclass only through reflect-metadata's prototype walk, and a
        // constructor that adds its own `@Inject` is exactly where that stops
        // being something to rely on.
        @InjectThrottlerOptions() options: ThrottlerModuleOptions,
        @InjectThrottlerStorage() storageService: ThrottlerStorage,
        reflector: Reflector,
        private readonly configService: ConfigService,
        @Optional()
        @Inject(THROTTLER_IDENTITY_VERIFIER)
        private readonly identityVerifier: ThrottlerIdentityVerifier | null = null,
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

            // The block lasts as long as the window the rule describes.
            // Without this line it keeps the value the base guard computed
            // from the GLOBAL ttl, so «5 logins per minute» could lock the
            // caller out for the global window instead of a minute — a
            // mismatch invisible with in-memory counters, because nothing
            // ever read it back.
            requestProps.blockDuration = rule.ttl;
        }

        const result = await super.handleRequest(requestProps);

        this.setRateLimitHeaders(context, requestProps);

        return result;
    }

    /**
     * The bucket a request counts against.
     *
     * - **Public routes — always the client address.** Sign-in, sign-up, code
     *   checks and refresh are what an attacker hammers, and on them a bearer
     *   token proves nothing about who is knocking: one stolen or throwaway
     *   account would otherwise buy a private bucket for guessing codes.
     * - **Everything else — the verified account, if there is one.** Keying an
     *   authenticated user on their account keeps a carrier NAT, where
     *   thousands of phones share one address, from rate-limiting all of them
     *   together. «Verified» is the point: the token's signature is checked
     *   (`ThrottlerIdentityVerifier`), so a forged `sub` falls through to the
     *   address like any anonymous request.
     */
    protected async getTracker(req: Record<string, unknown>, context?: ExecutionContext): Promise<string> {
        if (!this.isPublicRoute(context)) {
            const subject = await this.verifiedSubject(req);
            if (subject) return `user:${subject}`;
        }

        return `ip:${clientAddress(req)}`;
    }

    private isPublicRoute(context: ExecutionContext | undefined): boolean {
        if (!context) return true;

        return (
            this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC, [
                context.getHandler(),
                context.getClass(),
            ]) === true
        );
    }

    private async verifiedSubject(req: Record<string, unknown>): Promise<string | null> {
        if (!this.identityVerifier) return null;

        const headers = req.headers as Record<string, unknown> | undefined;
        const authHeader = headers?.authorization;
        if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) return null;

        return this.identityVerifier.verify(authHeader.slice(7)).catch(() => null);
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

/**
 * The client's address, as our own nginx saw it.
 *
 * **Assumption this rests on: nothing reaches the API port except that
 * nginx.** In production the API containers publish their ports on
 * `127.0.0.1` only (`infra/prod/docker-compose.prod.yml`), so the host's
 * nginx is the sole way in, and every API vhost (`infra/prod/nginx/dev.api.*`)
 * sets `proxy_set_header X-Real-IP $remote_addr` — which *replaces* whatever
 * the client sent with the TCP peer nginx accepted. Break the assumption —
 * publish the port, or put a proxy in front that passes the header through —
 * and every request can name its own bucket again.
 *
 * Deliberately not the others:
 * - `X-Forwarded-For` — nginx's `$proxy_add_x_forwarded_for` *appends* to the
 *   list the client sent, so its first entry is whatever the attacker wrote.
 * - `req.ip` while the header is present — behind docker's port proxy it is
 *   the bridge gateway, the same address for every caller.
 *
 * Without nginx (a developer's machine) the header is absent and the socket
 * address is used.
 */
function clientAddress(req: Record<string, unknown>): string {
    const headers = req.headers as Record<string, unknown> | undefined;
    const realIp = headers?.['x-real-ip'];
    if (typeof realIp === 'string' && realIp.length > 0) return realIp;

    return typeof req.ip === 'string' ? req.ip : 'unknown';
}
