import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import type { Params } from 'nestjs-pino';
import type { LevelWithSilent } from 'pino';

export interface LoggerConfigOptions {
    /** Becomes the `service` field on every line — `client-api` or `admin-api`. */
    serviceName: string;
    /** pino level: trace | debug | info | warn | error | fatal. Defaults to info. */
    level?: string;
    /**
     * Human-readable colourised output instead of JSON. Local dev only —
     * pino-pretty is a devDependency and must never be enabled in a container.
     */
    pretty?: boolean;
    /**
     * Paths whose request logs are dropped. Probes fire every few seconds
     * forever and would otherwise dominate log volume.
     */
    ignorePaths?: string[];
}

const DEFAULT_IGNORED_PATHS = ['/api/v1/health', '/api/v1/ready'];

/**
 * Anything listed here is replaced with [Redacted] before the line is written.
 * `*.field` matches that key at one level of nesting, which is what catches a
 * DTO logged inside an error payload.
 */
const REDACT_PATHS = [
    'req.headers.authorization',
    'req.headers.cookie',
    'req.headers["x-api-key"]',
    'res.headers["set-cookie"]',
    'password',
    // `passwordHash` is a DIFFERENT key and matches none of the others: pino
    // redacts by exact path, not by substring. One `logger.log({ user })`
    // anywhere would otherwise ship a bcrypt hash to the log store verbatim.
    'passwordHash',
    'currentPassword',
    'newPassword',
    'code',
    'codeHash',
    'otp',
    'token',
    'tokenHash',
    'accessToken',
    'refreshToken',
    '*.password',
    '*.passwordHash',
    '*.currentPassword',
    '*.newPassword',
    '*.code',
    '*.codeHash',
    '*.otp',
    '*.token',
    '*.tokenHash',
    '*.accessToken',
    '*.refreshToken',
];

/**
 * Shared pino configuration for both APIs.
 *
 * pino-http's autoLogging emits method, url, status and duration as real
 * fields rather than one interpolated string, so a log query can filter on
 * them instead of matching substrings.
 */
export function createLoggerConfig({
    serviceName,
    level,
    pretty = false,
    ignorePaths = DEFAULT_IGNORED_PATHS,
}: LoggerConfigOptions): Params {
    return {
        pinoHttp: {
            level: level ?? 'info',

            // Replaces pino's default {pid, hostname}: in a container the pid
            // is always 1 and the hostname is the container id.
            base: { service: serviceName },

            redact: { paths: REDACT_PATHS, censor: '[Redacted]' },

            // Correlates every line of one request. Stays in the JSON body and
            // is never promoted to a log label — request ids are unbounded
            // cardinality and would blow up an index.
            genReqId: (req: IncomingMessage): string => {
                const existing = req.headers['x-request-id'];
                return typeof existing === 'string' && existing.length > 0 ? existing : randomUUID();
            },

            customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error): LevelWithSilent => {
                if (err || res.statusCode >= 500) return 'error';
                if (res.statusCode >= 400) return 'warn';
                return 'info';
            },

            autoLogging: {
                ignore: (req: IncomingMessage): boolean => {
                    // Compare against the path only; probes carry no query
                    // string but proxies sometimes append one.
                    const path = (req.url ?? '').split('?')[0] ?? '';
                    return ignorePaths.includes(path);
                },
            },

            // The default serializers dump every header and would defeat the
            // point of redaction by volume alone.
            serializers: {
                req: (req: IncomingMessage & { id?: string }) => ({
                    id: req.id,
                    method: req.method,
                    url: req.url,
                    remoteAddress: req.headers['x-real-ip'] ?? req.socket?.remoteAddress,
                    userAgent: req.headers['user-agent'],
                }),
                res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
            },

            ...(pretty
                ? {
                      transport: {
                          target: 'pino-pretty',
                          options: {
                              singleLine: true,
                              translateTime: 'SYS:HH:MM:ss.l',
                              ignore: 'pid,hostname,service',
                          },
                      },
                  }
                : {}),
        },
    };
}
