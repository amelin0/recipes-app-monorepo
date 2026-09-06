import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';

import { AppModule } from './app.module';
import { AllConfig } from './common/config';

async function bootstrap(): Promise<void> {
    // bufferLogs holds startup lines until the pino logger is attached below,
    // so boot output is JSON too rather than NestJS's default format.
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    app.useLogger(app.get(Logger));

    // Lets SIGTERM run onModuleDestroy — without it the database pool is
    // never closed and the container has to be killed rather than stopped.
    app.enableShutdownHooks();

    app.setGlobalPrefix('api/v1');
    app.enableCors();
    app.useGlobalPipes(new ZodValidationPipe());

    const configService = app.get<ConfigService<AllConfig>>(ConfigService);
    const port = configService.getOrThrow('app.port', { infer: true });

    const swaggerConfig = new DocumentBuilder()
        .setTitle('DNS Admin API')
        .setDescription('Digital Nutrition Studio — API for the staff admin panel')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

    await app.listen(port);

    // Through the logger, not console.log: console writes bypass pino and
    // would reach the log store as unparseable non-JSON lines.
    app.get(Logger).log({ msg: 'admin-api started', port, prefix: '/api/v1', docs: '/docs' });
}

void bootstrap();
