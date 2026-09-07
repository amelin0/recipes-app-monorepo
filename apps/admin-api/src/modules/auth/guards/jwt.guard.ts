import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

import { IS_PUBLIC } from '../decorators';

/**
 * Registered globally in `AppModule`, so every route is closed unless marked
 * `@Public()` — deny-by-default, per ADR-0003.
 *
 * The client API guards per controller instead. The difference is deliberate:
 * there, a forgotten guard exposes one endpoint of a user's own data; here it
 * would expose the whole content catalogue and every user record.
 */
@Injectable()
export class AdminJwtGuard extends AuthGuard('jwt') {
    constructor(private readonly reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) return true;

        return super.canActivate(context);
    }
}
