import { SetMetadata } from '@nestjs/common';

import { IS_PUBLIC } from '@dns/api-common';

// The key lives in api-common because the throttler reads it too: a public
// route is throttled by client address, never by a token it happens to carry.
export { IS_PUBLIC };

/**
 * Opens a route that would otherwise be closed by the global guards.
 *
 * The admin service is deny-by-default (ADR-0003): every route requires a
 * session unless it says otherwise here. That inverts the client API's
 * arrangement on purpose — there, forgetting a guard exposes one endpoint;
 * here, forgetting one would expose the whole panel.
 */
export const Public = (): ReturnType<typeof SetMetadata> => SetMetadata(IS_PUBLIC, true);
