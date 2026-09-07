import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Paginated } from '@dns/api-common';
import { UserEntity } from '@dns/database';

import { CurrentUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

import {
    CreateRecipeInboundDto,
    RecipeCardView,
    RecipeDetailView,
    RecipeFiltersView,
    RecipeIdParam,
    RecipeListQuery,
} from './dto';
import { RecipeService } from './recipe.service';

@ApiTags('recipes')
@Controller('recipes')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class RecipeController {
    constructor(private readonly recipeService: RecipeService) {}

    /**
     * The catalogue, the search results and the category collection — one list,
     * narrowed by query. `meta.total` doubles as the live count under the
     * filter screen's «Показати N результатів».
     */
    @Get()
    @ApiQuery({ name: 'tab', required: false, enum: ['all', 'favorite', 'own'] })
    @ApiQuery({ name: 'q', required: false })
    @ApiQuery({ name: 'categories', required: false, description: 'Ids, comma-separated or repeated. Either of them.' })
    @ApiQuery({ name: 'cuisines', required: false, description: 'Either of them.' })
    @ApiQuery({ name: 'diets', required: false, description: 'Either of them.' })
    @ApiQuery({ name: 'products', required: false, description: 'All of them — a dish must contain every one.' })
    @ApiQuery({ name: 'productGroups', required: false, description: 'All of them.' })
    @ApiQuery({ name: 'caloriesMin', required: false })
    @ApiQuery({ name: 'caloriesMax', required: false, description: '800 means «800+»: no upper limit.' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiOkResponse({ type: RecipeCardView, isArray: true, description: 'Paged: `{ data, meta }`.' })
    async list(@CurrentUser() user: UserEntity, @Query() query: RecipeListQuery): Promise<Paginated<RecipeCardView>> {
        const { items, total } = await this.recipeService.list(user.id, query);
        return Paginated.of(items.map(RecipeCardView.from), total, query.page, query.limit);
    }

    /**
     * Declared before `:id` on purpose — a parameterised route placed first
     * would swallow «filters» and answer 404 for it.
     */
    @Get('filters')
    @ApiOkResponse({ type: RecipeFiltersView })
    async filters(@CurrentUser() user: UserEntity): Promise<RecipeFiltersView> {
        const options = await this.recipeService.filters(user.id);
        return RecipeFiltersView.from(options);
    }

    @Get(':id')
    @ApiParam({ name: 'id', format: 'uuid' })
    @ApiOkResponse({ type: RecipeDetailView })
    @ApiNotFoundResponse({ description: 'No such dish for this account.' })
    async detail(@CurrentUser() user: UserEntity, @Param() params: RecipeIdParam): Promise<RecipeDetailView> {
        const detail = await this.recipeService.detail(user.id, params.id);
        return RecipeDetailView.fromDetail(detail);
    }

    /**
     * A dish the user entered themselves. Answers with the finished dish, so
     * the success screen has its calories without a second round trip.
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ type: RecipeDetailView })
    @ApiBadRequestResponse({ description: 'Unknown cuisine, unknown product, or a step chip pointing nowhere.' })
    async create(@CurrentUser() user: UserEntity, @Body() body: CreateRecipeInboundDto): Promise<RecipeDetailView> {
        const detail = await this.recipeService.create(user.id, body);
        return RecipeDetailView.fromDetail(detail);
    }

    /** Only a dish this account made; a catalogue recipe answers 404 like any other. */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiParam({ name: 'id', format: 'uuid' })
    @ApiNoContentResponse({ description: 'Removed. Meals already logged from it keep their own figures.' })
    @ApiNotFoundResponse({ description: 'No such dish of this account’s own.' })
    async remove(@CurrentUser() user: UserEntity, @Param() params: RecipeIdParam): Promise<void> {
        await this.recipeService.remove(user.id, params.id);
    }

    /** A sub-resource rather than a toggle, so a retry cannot flip the heart back (ADR-0004). */
    @Put(':id/favorite')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiParam({ name: 'id', format: 'uuid' })
    @ApiNoContentResponse({ description: 'Hearted — idempotent.' })
    @ApiNotFoundResponse({ description: 'No such dish for this account.' })
    async favorite(@CurrentUser() user: UserEntity, @Param() params: RecipeIdParam): Promise<void> {
        await this.recipeService.addFavorite(user.id, params.id);
    }

    @Delete(':id/favorite')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiParam({ name: 'id', format: 'uuid' })
    @ApiNoContentResponse({ description: 'Unhearted — idempotent.' })
    @ApiNotFoundResponse({ description: 'No such dish for this account.' })
    async unfavorite(@CurrentUser() user: UserEntity, @Param() params: RecipeIdParam): Promise<void> {
        await this.recipeService.removeFavorite(user.id, params.id);
    }
}
