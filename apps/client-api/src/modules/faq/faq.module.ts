import { Module } from '@nestjs/common';

import { FaqRepositoryModule } from '@dns/database';

import { AuthModule } from '../auth';
import { CatalogModule } from '../catalog';

import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';

@Module({
    imports: [AuthModule, CatalogModule, FaqRepositoryModule],
    controllers: [FaqController],
    providers: [FaqService],
})
export class FaqModule {}
