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

/** What postgres-js throws, wrapped the way Drizzle wraps it. */
function driverError(code: string): Error {
    const pg = Object.assign(new Error('duplicate key value violates unique constraint "users_email_unique"'), {
        name: 'PostgresError',
        severity: 'ERROR',
        code,
        constraint_name: 'users_email_unique',
    });
    return new Error('Failed query: insert into "users" ("email", "password_hash") values ($1, $2)', { cause: pg });
}

test('a unique violation is a 409 conflict, not a 500', () => {
    const { status, body } = runFilter(driverError('23505'));

    assert.equal(status, 409);
    assert.equal(body.code, 'common.conflict');
});

test('a foreign-key violation is a 409 conflict too', () => {
    const { status, body } = runFilter(driverError('23503'));

    assert.equal(status, 409);
    assert.equal(body.code, 'common.conflict');
});

test('a conflict body names neither the constraint nor the query', () => {
    const serialized = JSON.stringify(runFilter(driverError('23505')).body);

    assert.doesNotMatch(serialized, /users_email_unique/);
    assert.doesNotMatch(serialized, /insert into/i);
});

test('any other database error stays an opaque 500', () => {
    const { status, body } = runFilter(driverError('40P01'));

    assert.equal(status, 500);
    assert.equal(body.message, 'Internal server error');
});

test('a Node system error with a five-letter code is not mistaken for SQLSTATE', () => {
    const { status } = runFilter(Object.assign(new Error('write EPIPE'), { code: 'EPIPE' }));

    assert.equal(status, 500);
});
