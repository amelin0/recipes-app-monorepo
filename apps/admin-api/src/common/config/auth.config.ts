import { registerAs } from '@nestjs/config';

import { AuthConfig } from './config.type';

// Two separations at once (docs/adr/0003-*.md): access vs refresh, so an
// access token cannot be replayed at the refresh endpoint; and admin vs
// client secrets, so a mobile user's token never verifies here.
export default registerAs<AuthConfig>('auth', () => ({
    access: {
        secret: process.env.ADMIN_JWT_SECRET!,
        expiresIn: process.env.ADMIN_JWT_EXPIRES_IN ?? '15m',
    },
    refresh: {
        secret: process.env.ADMIN_JWT_REFRESH_SECRET!,
        expiresIn: process.env.ADMIN_JWT_REFRESH_EXPIRES_IN ?? '30d',
    },
}));
