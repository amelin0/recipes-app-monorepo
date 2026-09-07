import assert from 'node:assert/strict';
import { test } from 'node:test';

import { StorageScope } from '@dns/shared-types';

import { StorageService } from './storage.service';
import { StorageConfig } from './storage.types';

const PATH_STYLE: StorageConfig = {
    endpoint: 'http://localhost:9100',
    publicUrl: 'http://localhost:9100',
    bucket: 'dns-uploads',
    region: 'us-east-1',
    accessKey: 'key',
    secretKey: 'secret',
    forcePathStyle: true,
    uploadUrlTtl: 900,
    maxFileSize: 1000,
    allowedMimeTypes: ['image/jpeg'],
};

const HOST_STYLE: StorageConfig = { ...PATH_STYLE, publicUrl: 'https://cdn.example.com', forcePathStyle: false };

const USER = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';

const pathStyleUrl = (key: string): string => `${PATH_STYLE.publicUrl}/${PATH_STYLE.bucket}/${key}`;

test('accepts a URL the same user uploaded for the same purpose', () => {
    const service = new StorageService(PATH_STYLE);
    const key = `users/${USER}/${StorageScope.ProfilePhoto}/abc-photo.jpg`;

    assert.equal(service.validateOwnership(pathStyleUrl(key), USER, StorageScope.ProfilePhoto), key);
});

test('refuses a file that belongs to somebody else', () => {
    const service = new StorageService(PATH_STYLE);
    const key = `users/${OTHER}/${StorageScope.ProfilePhoto}/abc-photo.jpg`;

    assert.throws(() => service.validateOwnership(pathStyleUrl(key), USER, StorageScope.ProfilePhoto));
});

test('refuses a file uploaded for a different purpose', () => {
    const service = new StorageService(PATH_STYLE);
    // Uploaded as a support attachment; must not become an avatar.
    const key = `users/${USER}/${StorageScope.Feedback}/abc-photo.jpg`;

    assert.throws(() => service.validateOwnership(pathStyleUrl(key), USER, StorageScope.ProfilePhoto));
});

test('refuses a URL pointing anywhere but our storage', () => {
    const service = new StorageService(PATH_STYLE);
    const key = `users/${USER}/${StorageScope.ProfilePhoto}/abc.jpg`;

    // The whole point: without this check `photoUrl` would accept any address
    // and every viewer of the profile would fetch it.
    assert.throws(() =>
        service.validateOwnership(
            `https://evil.example.com/${PATH_STYLE.bucket}/${key}`,
            USER,
            StorageScope.ProfilePhoto,
        ),
    );
    assert.throws(() =>
        service.validateOwnership(`http://localhost:9100/other-bucket/${key}`, USER, StorageScope.ProfilePhoto),
    );
    assert.throws(() => service.validateOwnership('not-a-url', USER, StorageScope.ProfilePhoto));
});

test('percent-encoding cannot smuggle a foreign prefix past the check', () => {
    const service = new StorageService(PATH_STYLE);
    const encoded = `users%2F${OTHER}%2F${StorageScope.ProfilePhoto}%2Fabc.jpg`;

    assert.throws(() => service.validateOwnership(pathStyleUrl(encoded), USER, StorageScope.ProfilePhoto));
});

test('reads host-style URLs when the store is not MinIO', () => {
    const service = new StorageService(HOST_STYLE);
    const key = `users/${USER}/${StorageScope.ProfilePhoto}/abc.jpg`;

    assert.equal(
        service.validateOwnership(
            `https://${HOST_STYLE.bucket}.cdn.example.com/${key}`,
            USER,
            StorageScope.ProfilePhoto,
        ),
        key,
    );
    assert.throws(() => service.validateOwnership(`https://cdn.example.com/${key}`, USER, StorageScope.ProfilePhoto));
});

test('refuses to sign a grant for an oversized file', async () => {
    const service = new StorageService(PATH_STYLE);

    await assert.rejects(
        service.createPresignedUpload({
            userId: USER,
            scope: StorageScope.ProfilePhoto,
            fileName: 'big.jpg',
            contentType: 'image/jpeg',
            size: PATH_STYLE.maxFileSize + 1,
        }),
    );
});

test('refuses to sign a grant for a disallowed content type', async () => {
    const service = new StorageService(PATH_STYLE);

    await assert.rejects(
        service.createPresignedUpload({
            userId: USER,
            scope: StorageScope.ProfilePhoto,
            fileName: 'script.svg',
            contentType: 'image/svg+xml',
            size: 10,
        }),
    );
});
