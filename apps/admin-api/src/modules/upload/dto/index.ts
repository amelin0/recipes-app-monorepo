import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { UploadGrant } from '@dns/shared-types';

/**
 * Scope is not taken from the request: everything the panel uploads is a
 * recipe photo, and letting the client name the scope would let it write into
 * the profile-photo prefix.
 */
const presignRecipeImageSchema = z.object({
    fileName: z.string().trim().min(1, 'File name is required').max(255),
    contentType: z.string().trim().min(1, 'Content type is required'),
    /**
     * The exact byte length. It is signed into the grant, so an upload of any
     * other size is rejected by the object store with an opaque 403 — the
     * client cannot estimate here.
     */
    size: z.number().int().positive('Size must be a positive number of bytes'),
});

export class PresignRecipeImageInboundDto extends createZodDto(presignRecipeImageSchema) {}

export class UploadGrantView {
    @ApiProperty({ description: 'Presigned PUT target. Short-lived.' })
    readonly uploadUrl: string;

    @ApiProperty({ description: 'Where the file will be readable — this is what comes back as photoUrl.' })
    readonly publicUrl: string;

    @ApiProperty() readonly key: string;
    @ApiProperty() readonly expiresAt: string;

    @ApiProperty({ description: 'Send these verbatim with the PUT; they are part of what was signed.' })
    readonly headers: Record<string, string>;

    private constructor(grant: UploadGrant) {
        this.uploadUrl = grant.uploadUrl;
        this.publicUrl = grant.publicUrl;
        this.key = grant.key;
        this.expiresAt = grant.expiresAt;
        this.headers = grant.headers;
    }

    static from(grant: UploadGrant): UploadGrantView {
        return new UploadGrantView(grant);
    }
}
