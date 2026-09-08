import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { DEFAULT_LANGUAGE } from '@dns/constants';
import { ReferenceRepository } from '@dns/database';

import { TagKind, TagView } from './tag.view';

@ApiTags('catalog')
@Controller()
@ApiBearerAuth()
export class CatalogController {
    // Products used to be served from here too. They moved to their own
    // module when the catalogue gained filters and archiving — a second,
    // simpler product list would have disagreed with the first about which
    // rows exist.
    constructor(private readonly referenceRepository: ReferenceRepository) {}

    /**
     * The three dictionaries as one flat list, which is what the panel's chip
     * row wants (decision of 2026-09-07).
     *
     * Read-only by design: `kind` is here so the form can group them and
     * enforce «one cuisine», not so the client can post them back as a bag.
     */
    @Get('tags')
    @ApiOkResponse({ type: TagView, isArray: true })
    @ApiQuery({ name: 'language', required: false })
    async tags(@Query('language') language = DEFAULT_LANGUAGE): Promise<TagView[]> {
        const [categories, cuisines, diets] = await Promise.all([
            this.referenceRepository.categories(language),
            this.referenceRepository.cuisines(language),
            this.referenceRepository.diets(language),
        ]);

        return [
            ...categories.map(item => TagView.from(TagKind.Category, item)),
            ...cuisines.map(item => TagView.from(TagKind.Cuisine, item)),
            ...diets.map(item => TagView.from(TagKind.Diet, item)),
        ];
    }
}
