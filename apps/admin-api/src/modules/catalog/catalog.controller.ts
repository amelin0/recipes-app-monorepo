import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { Paginated } from '@dns/api-common';
import { DEFAULT_LANGUAGE } from '@dns/constants';
import { ProductRepository, ReferenceRepository } from '@dns/database';

import { AdminProductView } from './dto';
import { TagKind, TagView } from './tag.view';

@ApiTags('catalog')
@Controller()
@ApiBearerAuth()
export class CatalogController {
    constructor(
        private readonly referenceRepository: ReferenceRepository,
        private readonly productRepository: ProductRepository,
    ) {}

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

    /**
     * Products for the composition editor.
     *
     * A dish can only be built from what the catalogue already holds
     * (FR-010) — the form has no «create product» affordance, because an
     * invented row would have no macros and would make the dish uncountable.
     */
    @Get('products')
    @ApiOkResponse({ type: AdminProductView, isArray: true })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'language', required: false })
    async products(
        @Query('search') search?: string,
        @Query('language') language = DEFAULT_LANGUAGE,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ): Promise<Paginated<AdminProductView>> {
        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

        const result = await this.productRepository.searchGlobal({
            language,
            query: search,
            page: pageNumber,
            limit: pageSize,
        });

        return Paginated.of(result.items.map(AdminProductView.from), result.total, pageNumber, pageSize);
    }
}
