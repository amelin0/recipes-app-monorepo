import { SetMetadata } from '@nestjs/common';

import { IS_PUBLIC } from '@dns/api-common';

// The key lives in api-common because the throttler reads it too: a public
// route is throttled by client address, never by a token it happens to carry.
export { IS_PUBLIC };

/**
 * Opens a route that sits under a guarded controller. Used only inside the
 * auth module — signing in cannot require being signed in.
 */
export const Public = (): ReturnType<typeof SetMetadata> => SetMetadata(IS_PUBLIC, true);
