import { createZodDto } from 'nestjs-zod';

import { verifyEmailSchema } from '@dns/validation';

export class VerifyEmailInboundDto extends createZodDto(verifyEmailSchema) {}
