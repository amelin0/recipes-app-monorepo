import { randomUUID } from 'node:crypto';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Inject, Injectable, PayloadTooLargeException } from '@nestjs/common';

import { StorageScope, UploadGrant } from '@dns/shared-types';

import { STORAGE_CONFIG } from './storage.tokens';
import { StorageConfig } from './storage.types';

export interface PresignRequest {
    userId: string;
    scope: StorageScope;
    fileName: string;
    contentType: string;
    size: number;
}

@Injectable()
export class StorageService {
    private readonly client: S3Client;

    constructor(@Inject(STORAGE_CONFIG) private readonly cfg: StorageConfig) {
        this.client = new S3Client({
            endpoint: cfg.endpoint,
            region: cfg.region,
            forcePathStyle: cfg.forcePathStyle,
            credentials: { accessKeyId: cfg.accessKey, secretAccessKey: cfg.secretKey },
        });
    }

    /**
     * Issues a short-lived permission to PUT one object.
     *
     * Bytes never pass through the API: the client uploads straight to the
     * object store. That keeps a 25 MB photo off the Node event loop, and it
     * is why the type and size limits are signed into the grant rather than
     * checked on arrival — the check has to happen before we hand out the URL,
     * because afterwards there is nothing left to check.
     */
    async createPresignedUpload({ userId, scope, fileName, contentType, size }: PresignRequest): Promise<UploadGrant> {
        if (size > this.cfg.maxFileSize) {
            throw new PayloadTooLargeException(`File exceeds max size of ${this.cfg.maxFileSize} bytes`);
        }

        if (!this.cfg.allowedMimeTypes.includes(contentType)) {
            throw new BadRequestException(`Content type not allowed: ${contentType}`);
        }

        const key = this.buildKey(userId, scope, fileName);

        // ContentType and ContentLength are part of what gets signed, so a
        // client cannot take a grant for a small JPEG and upload a large
        // executable with it.
        const command = new PutObjectCommand({
            Bucket: this.cfg.bucket,
            Key: key,
            ContentType: contentType,
            ContentLength: size,
        });

        const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: this.cfg.uploadUrlTtl });

        return {
            uploadUrl,
            publicUrl: this.buildPublicUrl(key),
            key,
            expiresAt: new Date(Date.now() + this.cfg.uploadUrlTtl * 1000).toISOString(),
            headers: { 'Content-Type': contentType },
        };
    }

    /**
     * Checks that a URL the client is asking us to store really points at a
     * file that client uploaded, for that purpose.
     *
     * Without this, `PATCH /profile` with a `photoUrl` is an open redirect
     * into our own database: any address could be written into a profile, and
     * every viewer of that profile would fetch it. The key layout
     * (`users/<id>/<scope>/…`) is what makes the check a prefix comparison.
     */
    validateOwnership(url: string, userId: string, scope: StorageScope): string {
        let parsed: URL;

        try {
            parsed = new URL(url);
        } catch {
            throw new BadRequestException('Invalid file URL');
        }

        const key = this.extractKey(parsed);
        if (key === null) {
            throw new BadRequestException('File URL does not point at our storage');
        }

        if (!key.startsWith(`users/${userId}/${scope}/`)) {
            throw new BadRequestException('File URL does not belong to the current user');
        }

        return key;
    }

    private buildKey(userId: string, scope: StorageScope, fileName: string): string {
        // The original name survives only as a readable suffix; the UUID is
        // what makes the key unique, so two uploads called `photo.jpg` cannot
        // overwrite each other.
        const safeName = fileName.replace(/[^\w.-]+/g, '_').slice(-100);
        return `users/${userId}/${scope}/${randomUUID()}-${safeName}`;
    }

    private buildPublicUrl(key: string): string {
        return this.cfg.forcePathStyle
            ? `${this.cfg.publicUrl}/${this.cfg.bucket}/${key}`
            : `${this.bucketHost()}/${key}`;
    }

    /** MinIO serves path-style (`host/bucket/key`); S3 proper serves `bucket.host/key`. */
    private bucketHost(): string {
        const url = new URL(this.cfg.publicUrl);
        return `${url.protocol}//${this.cfg.bucket}.${url.host}${url.pathname.replace(/\/$/, '')}`;
    }

    private extractKey(parsed: URL): string | null {
        const publicUrl = new URL(this.cfg.publicUrl);

        if (this.cfg.forcePathStyle) {
            if (parsed.origin !== publicUrl.origin) return null;

            const prefix = `/${this.cfg.bucket}/`;
            if (!parsed.pathname.startsWith(prefix)) return null;

            return decodeURIComponent(parsed.pathname.slice(prefix.length));
        }

        if (parsed.host !== `${this.cfg.bucket}.${publicUrl.host}` || parsed.protocol !== publicUrl.protocol) {
            return null;
        }

        return decodeURIComponent(parsed.pathname.replace(/^\//, ''));
    }
}
