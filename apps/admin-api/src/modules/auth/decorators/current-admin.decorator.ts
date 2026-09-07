import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AdminEntity } from '@dns/database';

/**
 * The account the access token belongs to, as loaded by `AdminJwtStrategy` —
 * an entity read fresh from the database, not the token's claims, so handlers
 * never act on a role that was true fifteen minutes ago.
 */
export const CurrentAdmin = createParamDecorator((_data: unknown, context: ExecutionContext): AdminEntity => {
    const request = context.switchToHttp().getRequest<{ user: AdminEntity }>();
    return request.user;
});
