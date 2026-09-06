import { ApiProperty } from '@nestjs/swagger';

import { UploadGrant } from '@dns/shared-types';

export class UploadGrantView implements UploadGrant {
    @ApiProperty({ description: 'Presigned PUT target. Upload the bytes here, not to this API.' })
    readonly uploadUrl: string;

    @ApiProperty({ description: 'Where the file will be readable. This is the value to send back to the API.' })
    readonly publicUrl: string;

    @ApiProperty()
    readonly key: string;

    @ApiProperty({ description: 'After this the grant is dead and a new one is needed.' })
    readonly expiresAt: string;

    @ApiProperty({
        description: 'Headers the PUT must carry verbatim, or the signature will not match.',
        example: { 'Content-Type': 'image/jpeg' },
    })
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
