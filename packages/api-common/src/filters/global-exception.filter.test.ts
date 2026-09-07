import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

import { GlobalExceptionFilter } from './global-exception.filter';

interface Captured {
    status: number;
    body: Record<string, unknown>;
}

function runFilter(exception: unknown): Captured {
    const captured: Partial<Captured> = {};

    const response = {
        status(code: number) {
            captured.status = code;
            return this;
        },
        json(body: Record<string, unknown>) {
            captured.body = body;
        },
    };

    const host = {
        switchToHttp: () => ({
            getResponse: () => response,
            getRequest: () => ({ method: 'POST', url: '/api/v1/auth/login' }),
        }),
    } as unknown as ArgumentsHost;

    new GlobalExceptionFilter().catch(exception, host);

    return captured as Captured;
}

test('carries `code` through from an HttpException payload', () => {
    const { status, body } = runFilter(
        new HttpException({ message: 'Too many attempts', code: 'auth.login-throttled' }, HttpStatus.TOO_MANY_REQUESTS),
    );

    assert.equal(status, 429);
    assert.equal(body.code, 'auth.login-throttled');
    assert.equal(body.message, 'Too many attempts');
});

test('drops a malformed `errors` payload instead of reshaping the response', () => {
    const { body } = runFilter(
        new HttpException({ message: 'Bad', errors: ['not-an-object'] }, HttpStatus.BAD_REQUEST),
    );

    assert.equal(body.errors, undefined);
});

test('keeps a well-formed `errors` list', () => {
    const errors = [{ path: 'email', message: 'Invalid email' }];
    const { body } = runFilter(new HttpException({ message: 'Bad', errors }, HttpStatus.BAD_REQUEST));

    assert.deepEqual(body.errors, errors);
});

test('never leaks the message of an unrecognised error', () => {
    const { status, body } = runFilter(new Error('connect ECONNREFUSED 127.0.0.1:5432'));

    assert.equal(status, 500);
    assert.equal(body.message, 'Internal server error');
});
