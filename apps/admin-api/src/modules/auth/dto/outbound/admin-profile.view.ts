import { ApiProperty } from '@nestjs/swagger';

import { AdminEntity } from '@dns/database';
import { AdminProfile, AdminRole } from '@dns/shared-types';

/** Whose session the panel holds. No password fields, ever. */
export class AdminProfileView implements AdminProfile {
    @ApiProperty({ format: 'uuid' })
    readonly id: string;

    @ApiProperty({ example: 'editor@rationfit.com' })
    readonly email: string;

    @ApiProperty({ example: 'Олена Ковальчук' })
    readonly fullName: string;

    @ApiProperty({ enum: AdminRole })
    readonly role: AdminRole;

    private constructor(admin: AdminEntity) {
        this.id = admin.id;
        this.email = admin.email;
        this.fullName = admin.fullName;
        this.role = admin.role;
    }

    static from(admin: AdminEntity): AdminProfileView {
        return new AdminProfileView(admin);
    }
}
