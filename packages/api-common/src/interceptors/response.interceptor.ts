import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

/**
 * Wraps every successful payload as `{ data }` — see `ApiResponse` in
 * `@dns/shared-types`. Both clients unwrap it once in their HTTP service.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    // `_context` is unused but positional — NestInterceptor puts the
    // CallHandler second.
    intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
        return next.handle().pipe(
            map(data => {
                // undefined stays a passthrough (void handlers, 204s).
                // null is a legitimate payload — "no active goal" is an answer,
                // not an absence — and reaches clients as { data: null }.
                if (data === undefined) {
                    return data;
                }

                return { data };
            }),
        );
    }
}
