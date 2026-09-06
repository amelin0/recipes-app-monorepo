import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { UserEntity } from '@dns/database';

/**
 * The account the access token belongs to, as loaded by `JwtStrategy` —
 * an entity, not raw claims, so handlers never re-read the token.
 */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): UserEntity => {
    const request = context.switchToHttp().getRequest<{ user: UserEntity }>();
    return request.user;
});
