import { registerAs } from '@nestjs/config';

import { DatabaseConfig } from './config.type';

export default registerAs<DatabaseConfig>('database', () => ({
    url: process.env.DATABASE_URL!,
}));
