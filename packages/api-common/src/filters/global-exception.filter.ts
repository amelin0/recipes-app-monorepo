import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';

import { ApiError } from '@dns/shared-types';

import { PgErrorCode, pgConstraintName, pgErrorCode } from '../errors';

import { CommonErrorCode } from './common-error-code';

function describe(exception: unknown): string {
    return exception instanceof Error ? `${exception.name}: ${exception.message}` : String(exception);
}

/**
 * The real driver error is usually one level down the cause chain, because
 * the layer above wraps it in a generic message.
 */
function causeOf(exception: unknown): unknown {
    if (!(exception instanceof Error)) return undefined;
    return (exception as Error & { cause?: unknown }).cause ?? undefined;
}

/**
 * Only a well-formed list travels. A thrower that put something else on
 * `errors` must not be able to reshape a documented response body.
 */
function isErrorList(value: unknown): value is ApiError['errors'] {
    return (
        Array.isArray(value) &&
        value.every(
            entry =>
                typeof entry === 'object' &&
                entry !== null &&
                typeof (entry as { path?: unknown }).path === 'string' &&
                typeof (entry as { message?: unknown }).message === 'string',
        )
    );
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const { status, body } = this.resolveException(exception);

        // Structured fields rather than one interpolated string, so a log
        // query can filter on them directly instead of matching substrings.
        const route = `${request.method} ${request.originalUrl ?? request.url}`;

        if (status >= 500) {
            this.logger.error({
                msg: `${route} → ${describe(exception)}`,
                route,
                status,
                err: exception,
                cause: causeOf(exception),
            });
        } else {
            // The constraint name goes to the log, never into the body: it is
            // what someone debugging a 409 needs, and what a caller probing the
            // schema would like to see. The driver error itself is not logged
            // either — Drizzle's wrapper carries the query parameters.
            const constraint = pgConstraintName(exception);
            this.logger.warn({ msg: body.message, route, status, ...(constraint ? { constraint } : {}) });
        }

        response.status(status).json(body);
    }

    private resolveException(exception: unknown): { status: number; body: ApiError } {
        if (exception instanceof ZodValidationException) {
            const zodError = exception.getZodError() as { errors: { path: (string | number)[]; message: string }[] };
            return {
                status: HttpStatus.UNPROCESSABLE_ENTITY,
                body: {
                    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                    message: 'Validation failed',
                    errors: zodError.errors.map(issue => ({
                        path: issue.path.join('.'),
                        message: issue.message,
                    })),
                },
            };
        }

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                return { status, body: { statusCode: status, message: exceptionResponse } };
            }

            const payload = exceptionResponse as Record<string, unknown>;

            // `code` and `errors` are carried through from the object a thrower
            // passed to `new HttpException({ ... }, status)`. Without this the
            // shape is silently reduced to `{ statusCode, message }`: a
            // throttled login and an expired verification code both arrive as a
            // bare 429/400 and the mobile app can only guess which message to
            // show. See `ApiError.code` in @dns/shared-types.
            return {
                status,
                body: {
                    statusCode: status,
                    message: (payload.message as string) ?? exception.message,
                    ...(typeof payload.code === 'string' ? { code: payload.code } : {}),
                    ...(isErrorList(payload.errors) ? { errors: payload.errors } : {}),
                },
            };
        }

        // A constraint caught a race the service could not see: two sign-ups
        // for one address, a row deleted between a read and the insert that
        // points at it. The data is intact — the database refused — so this
        // is a conflict to retry, not a server fault.
        //
        // Both codes answer 409, not 23503 as 404: a foreign-key violation is
        // either «the row you point at is gone» or «the row you delete is
        // still referenced», and only the English `detail` text tells them
        // apart. One honest status beats a guess parsed out of a message.
        const pgCode = pgErrorCode(exception);
        if (pgCode === PgErrorCode.UniqueViolation || pgCode === PgErrorCode.ForeignKeyViolation) {
            return {
                status: HttpStatus.CONFLICT,
                body: {
                    statusCode: HttpStatus.CONFLICT,
                    message: 'The request conflicts with the current state of the resource',
                    code: CommonErrorCode.Conflict,
                },
            };
        }

        // Anything unrecognised is a bug, not a client error: never leak its
        // message, and let the 500 branch above log the full chain.
        return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            body: {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Internal server error',
            },
        };
    }
}
