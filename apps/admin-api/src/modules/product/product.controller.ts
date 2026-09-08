import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
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
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { Paginated } from '@dns/api-common';
import { DEFAULT_LANGUAGE } from '@dns/constants';

import { AllConfig } from '../../common/config';

import {
    AdminProductDetailView,
    AdminProductView,
    CreateProductInboundDto,
    ProductListQueryDto,
    SetProductArchivedInboundDto,
    SetProductVerifiedInboundDto,
    UpdateProductInboundDto,
} from './dto';
import { ProductImportReport, ProductImportService } from './import/product-import.service';
import { ProductErrorCode } from './product.errors';
import { AdminProductService } from './product.service';

/**
 * One endpoint set for two readers: this list is also what the recipe form
 * searches for ingredients. Two nearly identical product lists would disagree
 * the first time one of them learned about archiving.
 */
@ApiTags('products')
@Controller('products')
@ApiBearerAuth()
export class AdminProductController {
    constructor(
        private readonly productService: AdminProductService,
        private readonly importService: ProductImportService,
        private readonly configService: ConfigService<AllConfig>,
    ) {}

    @Get()
    @ApiOkResponse({ type: AdminProductView, isArray: true })
    async list(@Query() query: ProductListQueryDto): Promise<Paginated<AdminProductView>> {
        const result = await this.productService.list(query);
        return Paginated.of(result.items.map(AdminProductView.from), result.total, query.page, query.limit);
    }

    @Get(':id')
    @ApiOkResponse({ type: AdminProductDetailView })
    @ApiNotFoundResponse({ description: 'No product with this id.' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('language') language = DEFAULT_LANGUAGE,
    ): Promise<AdminProductDetailView> {
        return AdminProductDetailView.fromDetail(await this.productService.findById(id, language));
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ type: AdminProductDetailView })
    @ApiBadRequestResponse({ description: 'Unknown product group.' })
    @ApiConflictResponse({ description: 'Another product already has this English name.' })
    async create(@Body() body: CreateProductInboundDto): Promise<AdminProductDetailView> {
        const id = await this.productService.create(body);
        return AdminProductDetailView.fromDetail(await this.productService.findById(id, DEFAULT_LANGUAGE));
    }

    /** `PUT`: translations are replaced whole, so the request carries them all. */
    @Put(':id')
    @ApiOkResponse({ type: AdminProductDetailView })
    @ApiNotFoundResponse({ description: 'No product with this id.' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: UpdateProductInboundDto,
    ): Promise<AdminProductDetailView> {
        await this.productService.update(id, body);
        return AdminProductDetailView.fromDetail(await this.productService.findById(id, DEFAULT_LANGUAGE));
    }

    /**
     * Confirming a user's product **promotes** it into the shared catalogue —
     * it becomes ours and visible to everyone (decision of 2026-09-08).
     */
    @Patch(':id/verification')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Verifying moves a custom product into the global catalogue.' })
    async setVerified(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: SetProductVerifiedInboundDto,
    ): Promise<void> {
        await this.productService.setVerified(id, body.isVerified);
    }

    /**
     * Out of the catalogue without deleting: dishes, meal-log entries and
     * shopping lists that reference it stay intact, and it disappears from
     * search in the app as well as here.
     */
    @Patch(':id/archive')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Hides the product from search; every existing reference survives.' })
    async setArchived(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: SetProductArchivedInboundDto,
    ): Promise<void> {
        await this.productService.setArchived(id, body.archived);
    }

    @Post('import')
    @HttpCode(HttpStatus.OK)
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    @ApiOkResponse({ description: 'created / updated / skipped, with a reason per rejected row.' })
    @ApiUnprocessableEntityResponse({ description: 'Not a CSV, missing columns, empty, or over the row limit.' })
    @UseInterceptors(FileInterceptor('file'))
    async import(@UploadedFile() file?: Express.Multer.File): Promise<ProductImportReport> {
        if (!file) {
            throw new BadRequestException({
                message: 'No file was uploaded under the field "file"',
                code: ProductErrorCode.BadImportFile,
            });
        }

        const maxRows = this.configService.get('app.importMaxRows', { infer: true }) ?? 2000;
        return this.importService.import(file.buffer.toString('utf8'), maxRows);
    }
}
