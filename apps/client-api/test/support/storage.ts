import { BadRequestException } from '@nestjs/common';

import { StorageErrorCode, StorageService } from '@dns/api-infrastructure/storage';
import { StorageScope, UploadGrant } from '@dns/shared-types';

/** Contents do not matter; the store checks the signed length, not the bytes. */
const BYTES = new Uint8Array(160).fill(0xff);

const grantFor = (storage: StorageService, userId: string, scope: StorageScope): Promise<UploadGrant> =>
    storage.createPresignedUpload({
        userId,
        scope,
        fileName: 'shot.jpg',
        contentType: 'image/jpeg',
        size: BYTES.length,
    });

/** A grant whose upload never happened — what `validateUpload` exists to refuse. */
export async function grantOnly(storage: StorageService, userId: string, scope: StorageScope): Promise<string> {
    return (await grantFor(storage, userId, scope)).publicUrl;
}

/**
 * Takes a grant and PUTs to it, the way the app does. A grant alone no longer
 * passes the services, so these suites need MinIO from docker compose as well
 * as Postgres.
 */
export async function upload(storage: StorageService, userId: string, scope: StorageScope): Promise<string> {
    const grant = await grantFor(storage, userId, scope);

    const response = await fetch(grant.uploadUrl, { method: 'PUT', headers: grant.headers, body: BYTES });
    if (!response.ok) {
        throw new Error(`PUT ${grant.key} failed: ${response.status} ${await response.text()}`);
    }

    return grant.publicUrl;
}

/** Whether the object behind an owned URL is still in the store. */
export async function isStored(
    storage: StorageService,
    url: string,
    userId: string,
    scope: StorageScope,
): Promise<boolean> {
    try {
        await storage.validateUpload(url, userId, scope);
        return true;
    } catch (error) {
        const code = error instanceof BadRequestException ? (error.getResponse() as { code?: unknown }).code : null;
        if (code === StorageErrorCode.NotUploaded) return false;
        throw error;
    }
}
