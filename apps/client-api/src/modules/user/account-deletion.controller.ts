import { Controller, Delete, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserEntity } from '@dns/database';

import { CurrentUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

import { AccountDeletionService } from './account-deletion.service';
import { AccountDeletionRequestView } from './dto';

@ApiTags('profile')
@Controller('profile/deletion-request')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class AccountDeletionController {
    constructor(private readonly deletionService: AccountDeletionService) {}

    @Post()
    @ApiCreatedResponse({ type: AccountDeletionRequestView })
    @ApiConflictResponse({ description: 'A request is already pending.' })
    async request(@CurrentUser() user: UserEntity): Promise<AccountDeletionRequestView> {
        return AccountDeletionRequestView.from(await this.deletionService.request(user.id));
    }

    /**
     * «Відновити обліковий запис». `DELETE` on the request rather than a
     * `restore` action: what the user cancels *is* the request, and it either
     * exists or it does not (ADR-0004, rule 6).
     */
    @Delete()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Request cancelled; the account is fully usable again.' })
    @ApiNotFoundResponse({ description: 'Nothing pending to cancel.' })
    async cancel(@CurrentUser() user: UserEntity): Promise<void> {
        await this.deletionService.cancel(user.id);
    }
}
