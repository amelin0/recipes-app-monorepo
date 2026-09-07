import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiPayloadTooLargeResponse,
    ApiTags,
} from '@nestjs/swagger';

import { SetThrottleKey } from '@dns/api-common';
import { StorageService } from '@dns/api-infrastructure/storage';
import { AdminEntity } from '@dns/database';
import { StorageScope } from '@dns/shared-types';

import { ThrottleKey } from '../../common/config';
import { CurrentAdmin } from '../auth';

import { PresignRecipeImageInboundDto, UploadGrantView } from './dto';

@ApiTags('uploads')
@Controller('uploads')
@ApiBearerAuth()
export class UploadController {
    constructor(private readonly storageService: StorageService) {}

    /**
     * Creates permission to upload one recipe photo, then gets out of the way.
     *
     * The bytes go straight to the object store — the same arrangement the
     * mobile app uses, and the reason nginx in front of this service can keep
     * `client_max_body_size` at 2 MB. The V1 panel posted the file here
     * instead; that would have meant a second upload path to maintain and a
     * 25 MB photo sitting in the worker's memory.
     *
     * `POST` on a collection because what is created is the grant, not the
     * file: the file appears later, and we only learn about it when the panel
     * sends its URL back with the recipe.
     */
    @Post('recipe-image')
    @HttpCode(HttpStatus.CREATED)
    @SetThrottleKey(ThrottleKey.FileUploadPresign)
    @ApiCreatedResponse({ type: UploadGrantView })
    @ApiBadRequestResponse({ description: 'Content type not allowed.' })
    @ApiPayloadTooLargeResponse({ description: 'File exceeds the configured maximum.' })
    async presign(
        @CurrentAdmin() admin: AdminEntity,
        @Body() body: PresignRecipeImageInboundDto,
    ): Promise<UploadGrantView> {
        const grant = await this.storageService.createPresignedUpload({
            // The key is namespaced by whoever asked for it, which makes an
            // orphaned upload traceable to the editor who abandoned the form.
            userId: admin.id,
            scope: StorageScope.RecipePhoto,
            ...body,
        });

        return UploadGrantView.from(grant);
    }
}
