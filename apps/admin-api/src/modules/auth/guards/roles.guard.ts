import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AdminEntity } from '@dns/database';
import { AdminRole } from '@dns/shared-types';

import { AdminAuthErrorCode } from '../auth.errors';
import { IS_PUBLIC, REQUIRED_ROLES } from '../decorators';

/**
 * Enforces `@Roles(...)`. Runs after `AdminJwtGuard`, which is what puts the
 * entity on the request; on a public route there is nobody to check, so it
 * stands aside.
 */
@Injectable()
export class AdminRolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const required = this.reflector.getAllAndOverride<AdminRole[] | undefined>(REQUIRED_ROLES, [
            context.getHandler(),
            context.getClass(),
        ]);

        // No decorator means "any authenticated admin", which is most routes:
        // ADMIN already carries full access to content and users.
        if (!required || required.length === 0) return true;

        const { user } = context.switchToHttp().getRequest<{ user?: AdminEntity }>();

        if (!user || !required.includes(user.role)) {
            throw new ForbiddenException({
                message: 'This action requires a higher role',
                code: AdminAuthErrorCode.Forbidden,
            });
        }

        return true;
    }
}
