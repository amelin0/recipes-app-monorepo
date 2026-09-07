import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Paginated } from '@dns/api-common';
import { UserEntity } from '@dns/database';

import { CurrentUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

import { CreateProductInboundDto, ProductSearchQuery, ProductView } from './dto';
import { ProductService } from './product.service';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    /**
     * The «Інгредієнти» section of the search screen, and the picker that adds
     * a product to a dish. Names are matched in the reader's language.
     */
    @Get()
    @ApiQuery({ name: 'q', required: false, example: 'помідор' })
    @ApiQuery({ name: 'groupId', required: false })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 20 })
    @ApiOkResponse({ type: ProductView, isArray: true, description: 'Paged: `{ data, meta }`.' })
    async search(@CurrentUser() user: UserEntity, @Query() query: ProductSearchQuery): Promise<Paginated<ProductView>> {
        const { items, total } = await this.productService.search(user.id, query);
        return Paginated.of(items.map(ProductView.from), total, query.page, query.limit);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ type: ProductView })
    @ApiBadRequestResponse({ description: 'Unknown product group.' })
    async create(@CurrentUser() user: UserEntity, @Body() body: CreateProductInboundDto): Promise<ProductView> {
        const product = await this.productService.create(user.id, body);
        return ProductView.from(product);
    }
}
