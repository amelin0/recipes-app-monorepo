import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ExecutionContext, SetMetadata } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';

import { IS_PUBLIC } from '../decorators';
import { ThrottlerIdentityVerifier } from '../throttler';

import { CustomThrottlerGuard } from './custom-throttler.guard';

/** Stands in for an app's verifier: only the literal token `signed` checks out. */
const verifier: ThrottlerIdentityVerifier = {
    verify: token => Promise.resolve(token === 'signed' ? 'user-1' : null),
};

class ProbeGuard extends CustomThrottlerGuard {
    track(req: Record<string, unknown>, context: ExecutionContext): Promise<string> {
        return this.getTracker(req, context);
    }
}

function guard(withVerifier = true): ProbeGuard {
    return new ProbeGuard(
        [] as ThrottlerModuleOptions,
        {} as ThrottlerStorage,
        new Reflector(),
        {} as ConfigService,
        withVerifier ? verifier : null,
    );
}

function protectedRoute(): void {}
function publicRoute(): void {}
SetMetadata(IS_PUBLIC, true)(publicRoute);
class SomeController {}

function contextFor(handler: () => void): ExecutionContext {
    return { getHandler: () => handler, getClass: () => SomeController } as unknown as ExecutionContext;
}

/** An unsigned JWT with a chosen `sub` — what the old guard trusted. */
function forgedJwt(sub: string): string {
    const encode = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url');
    return `${encode({ alg: 'none' })}.${encode({ sub })}.`;
}

function request(headers: Record<string, string>, ip = '172.17.0.1'): Record<string, unknown> {
    return { headers, ip };
}

test('a verified token on a protected route buckets by account', async () => {
    const tracker = await guard().track(
        request({ authorization: 'Bearer signed', 'x-real-ip': '203.0.113.7' }),
        contextFor(protectedRoute),
    );

    assert.equal(tracker, 'user:user-1');
});

test('a forged token cannot open a bucket of its own', async () => {
    const probe = guard();
    const context = contextFor(protectedRoute);

    const first = await probe.track(
        request({ authorization: `Bearer ${forgedJwt('a')}`, 'x-real-ip': '203.0.113.7' }),
        context,
    );
    const second = await probe.track(
        request({ authorization: `Bearer ${forgedJwt('b')}`, 'x-real-ip': '203.0.113.7' }),
        context,
    );

    assert.equal(first, 'ip:203.0.113.7');
    assert.equal(second, first);
});

test('a public route buckets by address even with a valid token', async () => {
    const tracker = await guard().track(
        request({ authorization: 'Bearer signed', 'x-real-ip': '203.0.113.7' }),
        contextFor(publicRoute),
    );

    assert.equal(tracker, 'ip:203.0.113.7');
});

test('without a verifier every request buckets by address', async () => {
    const tracker = await guard(false).track(
        request({ authorization: 'Bearer signed', 'x-real-ip': '203.0.113.7' }),
        contextFor(protectedRoute),
    );

    assert.equal(tracker, 'ip:203.0.113.7');
});

test('X-Real-IP wins over X-Forwarded-For and the socket address', async () => {
    const tracker = await guard().track(
        request({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1, 203.0.113.7' }),
        contextFor(publicRoute),
    );

    assert.equal(tracker, 'ip:203.0.113.7');
});

test('with no proxy in front the socket address is used', async () => {
    const tracker = await guard().track(request({}, '127.0.0.1'), contextFor(publicRoute));

    assert.equal(tracker, 'ip:127.0.0.1');
});

test('a verifier that throws is treated as «no identity», not as an error', async () => {
    const throwing = new ProbeGuard(
        [] as ThrottlerModuleOptions,
        {} as ThrottlerStorage,
        new Reflector(),
        {} as ConfigService,
        {
            verify: () => Promise.reject(new Error('boom')),
        },
    );

    const tracker = await throwing.track(
        request({ authorization: 'Bearer signed', 'x-real-ip': '203.0.113.7' }),
        contextFor(protectedRoute),
    );

    assert.equal(tracker, 'ip:203.0.113.7');
});
