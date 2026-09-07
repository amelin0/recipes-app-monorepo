import { Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { AdminEntity, AdminRepository } from '@dns/database';
import { AdminRole } from '@dns/shared-types';

import { AdminAuthErrorCode } from './auth.errors';
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
    @ApiForbiddenResponse({ description: 'Requires SUPER_ADMIN, or an attempt to lock yourself out.' })
    async update(
        @Param('id') id: string,
        @Body() body: UpdateAdminInboundDto,
        @CurrentAdmin() actor: AdminEntity,
    ): Promise<void> {
        // Deactivating yourself, or demoting yourself, is how an organisation
        // ends up with no SUPER_ADMIN and no way back in short of a database
        // console. The rule is narrow on purpose: it stops the accident, not
        // the deliberate handover, which is done from the other account.
        if (id === actor.id) {
            throw new ForbiddenException({
                message: 'You cannot change your own role or active state',
                code: AdminAuthErrorCode.Forbidden,
            });
        }

        if (body.role !== undefined) {
            await this.adminRepository.setRole(id, body.role);
        }

        if (body.isActive !== undefined) {
            await this.authService.setActive(id, body.isActive);
        }
    }
}
