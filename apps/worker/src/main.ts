import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { AllConfig } from './common/config';

/**
 * A worker with an HTTP server, and only for two routes.
 *
 * `/health` and `/metrics` are the whole surface. Without them the container
 * would be invisible to the same monitoring that watches the APIs — and the
 * failure mode of a queue worker is silence, which looks exactly like having
 * nothing to do.
 */
async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    app.useLogger(app.get(Logger));

    // Without this SIGTERM kills the process mid-job: BullMQ's graceful close
    // and the database pool both hang off the shutdown hooks.
    app.enableShutdownHooks();

    const configService = app.get<ConfigService<AllConfig>>(ConfigService);
    const port = configService.getOrThrow('app.port', { infer: true });

    await app.listen(port);

    app.get(Logger).log(`worker listening on ${port}`);
}

void bootstrap();
