import { Injectable } from '@nestjs/common';

import { FaqRepository, FaqTopicEntity } from '@dns/database';

import { ReaderLanguageService } from '../catalog/reader-language.service';

@Injectable()
export class FaqService {
    constructor(
        private readonly faq: FaqRepository,
        private readonly language: ReaderLanguageService,
    ) {}

    async topics(userId: string): Promise<FaqTopicEntity[]> {
        return this.faq.findAll(await this.language.of(userId));
    }
}
