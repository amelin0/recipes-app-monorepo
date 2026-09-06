import { registerAs } from '@nestjs/config';

import { AppConfig, AppEnv } from './config.type';

export default registerAs<AppConfig>('app', () => ({
    env: (process.env.NODE_ENV as AppEnv) || AppEnv.Dev,
    port: parseInt(process.env.CLIENT_API_PORT ?? '3000', 10),
}));
