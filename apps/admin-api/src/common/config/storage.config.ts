import { registerAs } from '@nestjs/config';

import { StorageConfig } from './config.type';

const DEFAULT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default registerAs<StorageConfig>('storage', () => ({
    endpoint: process.env.S3_ENDPOINT ?? '',
    // Trailing slash stripped: every URL is built by appending, and a double
    // slash would break the ownership check's prefix comparison.
    publicUrl: (process.env.S3_PUBLIC_URL ?? '').replace(/\/+$/, ''),
    bucket: process.env.S3_BUCKET ?? '',
    region: process.env.S3_REGION ?? 'us-east-1',
    accessKey: process.env.S3_ACCESS_KEY ?? '',
    secretKey: process.env.S3_SECRET_KEY ?? '',
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true').toLowerCase() === 'true',
    uploadUrlTtl: parseInt(process.env.S3_UPLOAD_URL_TTL ?? '900', 10),
    maxFileSize: parseInt(process.env.S3_MAX_FILE_SIZE ?? `${25 * 1024 * 1024}`, 10),
    allowedMimeTypes: process.env.S3_ALLOWED_MIME_TYPES
        ? process.env.S3_ALLOWED_MIME_TYPES.split(',').map(value => value.trim())
        : DEFAULT_MIME_TYPES,
}));
