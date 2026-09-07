import { createZodDto } from 'nestjs-zod';

import { presignUploadSchema } from '@dns/validation';

export class PresignUploadInboundDto extends createZodDto(presignUploadSchema) {}
