export interface StorageConfig {
    /** Endpoint the API signs against and talks to. Inside compose this is the service name. */
    endpoint: string;
    /** Base URL clients use. Differs from `endpoint` whenever the store sits behind a proxy. */
    publicUrl: string;
    bucket: string;
    region: string;
    accessKey: string;
    secretKey: string;
    /** MinIO needs path-style addressing; real S3 does not. */
    forcePathStyle: boolean;
    /** Seconds a presigned upload URL stays valid. */
    uploadUrlTtl: number;
    maxFileSize: number;
    allowedMimeTypes: string[];
}
