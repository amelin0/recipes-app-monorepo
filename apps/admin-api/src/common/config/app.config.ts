import { registerAs } from '@nestjs/config';

import { AppConfig, AppEnv } from './config.type';

export default registerAs<AppConfig>('app', () => ({
    env: (process.env.NODE_ENV as AppEnv) || AppEnv.Dev,
    port: parseInt(process.env.ADMIN_API_PORT ?? '3001', 10),
    // A ceiling on one CSV upload, so a single request cannot eat the worker's
    // memory. 2000 is comfortably above the largest batch anyone has described
    // and well below what would hurt.
    importMaxRows: parseInt(process.env.IMPORT_MAX_ROWS ?? '2000', 10),
}));
