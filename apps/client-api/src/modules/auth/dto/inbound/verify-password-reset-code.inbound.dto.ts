import { createZodDto } from 'nestjs-zod';

import { verifyPasswordResetCodeSchema } from '@dns/validation';

export class VerifyPasswordResetCodeInboundDto extends createZodDto(verifyPasswordResetCodeSchema) {}
