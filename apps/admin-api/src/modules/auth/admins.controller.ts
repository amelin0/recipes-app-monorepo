import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiConflictResponse,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { AdminEntity, AdminRepository } from '@dns/database';
import { AdminRole } from '@dns/shared-types';

import { AdminAuthService } from './auth.service';
import { CurrentAdmin, Roles } from './decorators';
import { AdminProfileView } from './dto';

const updateAdminSchema = z.object({
    isActive: z.boolean().optional(),
    role: z.nativeEnum(AdminRole).optional(),
});

class UpdateAdminInboundDto extends createZodDto(updateAdminSchema) {}

/**
 * The little that sign-in needs to be complete: someone has to be able to take
 * access away (sign-in FR-008, User Story 4), and only a SUPER_ADMIN may
 * (FR-011).
 *
 * Creating accounts is deliberately absent — the seed provisions the first
 * one, and an invite flow needs email delivery and a product decision about
 * what a new admin sees first. Full staff management belongs to its own slice.
 */
@ApiTags('admins')
@Controller('admins')
@Roles(AdminRole.SuperAdmin)
@ApiBearerAuth()
export class AdminsController {
    constructor(
        private readonly adminRepository: AdminRepository,
        private readonly authService: AdminAuthService,
    ) {}

    @Get()
    @ApiOkResponse({ type: AdminProfileView, isArray: true })
    @ApiForbiddenResponse({ description: 'Requires SUPER_ADMIN.' })
    async list(): Promise<AdminProfileView[]> {
        const admins = await this.adminRepository.findAll();
        return admins.map(AdminProfileView.from);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Deactivating also ends every session the account holds.' })
    @ApiForbiddenResponse({
        description: 'Requires SUPER_ADMIN — still, at the moment of the change — or an attempt to lock yourself out.',
    })
    @ApiNotFoundResponse({ description: 'No such staff account.' })
    @ApiConflictResponse({
        description: 'The change would leave no other active SUPER_ADMIN (`admin-auth.last-super-admin`).',
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: UpdateAdminInboundDto,
        @CurrentAdmin() actor: AdminEntity,
    ): Promise<void> {
        // Role and active state change together, in one locked transaction —
        // two separate writes would let a concurrent request see, and act on,
        // the state between them.
        await this.authService.updateAccess(id, body, actor.id);
    }
}
