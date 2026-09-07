import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'IS_PUBLIC';

/**
 * Opens a route that sits under a guarded controller. Used only inside the
 * auth module — signing in cannot require being signed in.
 */
export const Public = (): ReturnType<typeof SetMetadata> => SetMetadata(IS_PUBLIC, true);
