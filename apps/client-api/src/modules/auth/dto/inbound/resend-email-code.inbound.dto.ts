import { createZodDto } from 'nestjs-zod';

import { resendEmailCodeSchema } from '@dns/validation';

export class ResendEmailCodeInboundDto extends createZodDto(resendEmailCodeSchema) {}
