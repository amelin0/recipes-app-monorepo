import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { MetricsController } from './metrics.controller';
import { MetricsMiddleware } from './metrics.middleware';
import { MetricsService } from './metrics.service';

/**
 * Global so `MetricsService` is a true singleton: two instances would mean
 * two registries, and half the observations missing from every scrape.
 */
@Global()
@Module({
    controllers: [MetricsController],
    providers: [MetricsService],
    exports: [MetricsService],
})
export class MetricsModule implements NestModule {
    // '*' rather than a route list: unmatched paths must be counted too, and
    // by definition they belong to no controller.
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(MetricsMiddleware).forRoutes('*');
    }
}
