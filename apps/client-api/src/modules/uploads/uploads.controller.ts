import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiPayloadTooLargeResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { SetThrottleKey } from '@dns/api-common';
import { StorageService } from '@dns/api-infrastructure/storage';
import { UserEntity } from '@dns/database';

import { ThrottleKey } from '../../common/config';
import { CurrentUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

import { PresignUploadInboundDto, UploadGrantView } from './dto';

@ApiTags('uploads')
@Controller('uploads')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class UploadsController {
    constructor(private readonly storageService: StorageService) {}

    /**
     * Creates permission to upload one file, then gets out of the way — the
     * bytes go straight to the object store, never through this API.
     *
     * `POST` on a collection because the thing being created is the grant
     * itself (ADR-0004, rule 3), not the file: the file appears later, and we
     * only learn about it when the client sends its URL back.
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @SetThrottleKey(ThrottleKey.FileUploadPresign)
    @ApiCreatedResponse({ type: UploadGrantView })
    @ApiBadRequestResponse({ description: 'Content type not allowed.' })
    @ApiPayloadTooLargeResponse({ description: 'File exceeds the configured maximum.' })
    async presign(@CurrentUser() user: UserEntity, @Body() body: PresignUploadInboundDto): Promise<UploadGrantView> {
        const grant = await this.storageService.createPresignedUpload({ userId: user.id, ...body });
        return UploadGrantView.from(grant);
    }
}
