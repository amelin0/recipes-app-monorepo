import { SetMetadata } from '@nestjs/common';

import { AdminRole } from '@dns/shared-types';

export const REQUIRED_ROLES = 'REQUIRED_ROLES';

/**
 * Narrows a route to specific roles. Absent, a route is open to any
 * authenticated admin — which is the common case, since ADMIN already means
 * full access to content and users (sign-in FR-011).
 *
 * Use it for the few things only a SUPER_ADMIN may do: provisioning accounts,
 * deactivating them, changing roles.
 */
export const Roles = (...roles: AdminRole[]): ReturnType<typeof SetMetadata> => SetMetadata(REQUIRED_ROLES, roles);
