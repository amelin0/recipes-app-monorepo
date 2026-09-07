import { Module } from '@nestjs/common';

import { FaqRepository } from './faq.repository';

@Module({
    providers: [FaqRepository],
    exports: [FaqRepository],
})
export class FaqRepositoryModule {}
