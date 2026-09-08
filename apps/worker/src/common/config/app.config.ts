import { registerAs } from '@nestjs/config';

import { WorkerAppConfig } from './config.type';

export default registerAs<WorkerAppConfig>('app', () => ({
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.WORKER_PORT ?? '3002', 10),
}));
