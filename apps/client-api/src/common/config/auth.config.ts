import { registerAs } from '@nestjs/config';

import { AuthConfig } from './config.type';

// Access and refresh are signed with DIFFERENT secrets so an access token can
// never be replayed at the refresh endpoint — see docs/adr/0003-*.md.
export default registerAs<AuthConfig>('auth', () => ({
    access: {
        secret: process.env.JWT_SECRET!,
        expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    },
    refresh: {
        secret: process.env.JWT_REFRESH_SECRET!,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
    },
}));
