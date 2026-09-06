import { createZodDto } from 'nestjs-zod';

import { requestPasswordResetSchema } from '@dns/validation';

export class RequestPasswordResetInboundDto extends createZodDto(requestPasswordResetSchema) {}
