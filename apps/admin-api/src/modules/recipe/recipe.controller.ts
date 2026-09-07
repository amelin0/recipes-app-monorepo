import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiConflictResponse,
    ApiConsumes,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { Paginated } from '@dns/api-common';

import { AllConfig } from '../../common/config';

import {
    AdminRecipeDetailView,
    AdminRecipeListItemView,
    BulkDeleteRecipesInboundDto,
    CreateRecipeInboundDto,
    ImportReportView,
    RecipeListQueryDto,
    UpdateRecipeInboundDto,
} from './dto';
import { RecipeImportService } from './import/import.service';
import { RecipeErrorCode } from './recipe.errors';
import { AdminRecipeService } from './recipe.service';

@ApiTags('recipes')
@Controller('recipes')
@ApiBearerAuth()
export class AdminRecipeController {
    constructor(
        private readonly recipeService: AdminRecipeService,
        private readonly importService: RecipeImportService,
        private readonly configService: ConfigService<AllConfig>,
    ) {}

    @Get()
    @ApiOkResponse({ type: AdminRecipeListItemView, isArray: true })
    async list(@Query() query: RecipeListQueryDto): Promise<Paginated<AdminRecipeListItemView>> {
        const result = await this.recipeService.list(query);
        return Paginated.of(result.items.map(AdminRecipeListItemView.from), result.total, query.page, query.limit);
    }

    @Get(':id')
    @ApiOkResponse({ type: AdminRecipeDetailView })
    @ApiNotFoundResponse({ description: 'No catalogue recipe with this id.' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AdminRecipeDetailView> {
        return AdminRecipeDetailView.from(await this.recipeService.findById(id));
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ type: AdminRecipeDetailView })
    @ApiBadRequestResponse({ description: 'An ingredient is not in the product catalogue.' })
    @ApiConflictResponse({ description: 'The import key already belongs to another recipe.' })
    async create(@Body() body: CreateRecipeInboundDto): Promise<AdminRecipeDetailView> {
        const id = await this.recipeService.create(body);
        return AdminRecipeDetailView.from(await this.recipeService.findById(id));
    }

    /**
     * `PUT`, not `PATCH`: the composition and the steps are replaced whole, so
     * the request carries the entire dish. Calling it a partial update would
     * be a lie the first time an editor omitted `ingredients`.
     */
    @Put(':id')
    @ApiOkResponse({ type: AdminRecipeDetailView })
    @ApiNotFoundResponse({ description: 'No catalogue recipe with this id.' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: UpdateRecipeInboundDto,
    ): Promise<AdminRecipeDetailView> {
        await this.recipeService.update(id, body);
        return AdminRecipeDetailView.from(await this.recipeService.findById(id));
    }

    /**
     * `POST` on a sub-path rather than `DELETE` with a body: HTTP permits the
     * latter, but proxies and clients drop it often enough that it is not
     * worth the elegance.
     */
    @Post('bulk-delete')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ description: 'How many rows actually went.' })
    @ApiConflictResponse({ description: 'Some dishes are in a user meal plan; nothing was deleted.' })
    async bulkDelete(@Body() body: BulkDeleteRecipesInboundDto): Promise<{ deleted: number }> {
        return { deleted: await this.recipeService.deleteMany(body.ids) };
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNotFoundResponse({ description: 'No catalogue recipe with this id.' })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        const deleted = await this.recipeService.deleteMany([id]);
        if (deleted === 0) await this.recipeService.findById(id);
    }

    /**
     * The one place a file really does travel through this API.
     *
     * Recipe photos use presigned URLs precisely to keep bytes off the worker,
     * but a CSV has to be read rather than stored — and at 500 rows it is
     * roughly 200 KB, which is not the kind of payload that argument was about.
     *
     * `200` even with errors in the report: partial success is the expected
     * outcome (FR-003), not a failed request.
     */
    @Post('import')
    @HttpCode(HttpStatus.OK)
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    @ApiOkResponse({ type: ImportReportView })
    @ApiUnprocessableEntityResponse({ description: 'Not a CSV, missing columns, empty, or over the row limit.' })
    @UseInterceptors(FileInterceptor('file'))
    async import(@UploadedFile() file?: Express.Multer.File): Promise<ImportReportView> {
        if (!file) {
            throw new BadRequestException({
                message: 'No file was uploaded under the field "file"',
                code: RecipeErrorCode.BadImportFile,
            });
        }

        const maxRows = this.configService.get('app.importMaxRows', { infer: true }) ?? 2000;
        const report = await this.importService.import(file.buffer.toString('utf8'), maxRows);

        return new ImportReportView(report);
    }
}
