import { registerAs } from '@nestjs/config';

import { OAuthConfig } from './config.type';

export default registerAs<OAuthConfig>('oauth', () => ({
    google: { clientId: process.env.GOOGLE_CLIENT_ID ?? '' },
    apple: { clientId: process.env.APPLE_CLIENT_ID ?? '' },
}));
