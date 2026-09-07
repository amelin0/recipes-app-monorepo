import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'IS_PUBLIC';

/**
 * Opens a route that would otherwise be closed by the global guards.
 *
 * The admin service is deny-by-default (ADR-0003): every route requires a
 * session unless it says otherwise here. That inverts the client API's
 * arrangement on purpose — there, forgetting a guard exposes one endpoint;
 * here, forgetting one would expose the whole panel.
 */
export const Public = (): ReturnType<typeof SetMetadata> => SetMetadata(IS_PUBLIC, true);
