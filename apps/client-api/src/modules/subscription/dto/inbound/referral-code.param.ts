import { createZodDto } from 'nestjs-zod';

import { referralCodeParamSchema } from '@dns/validation';

export class ReferralCodeParam extends createZodDto(referralCodeParamSchema) {}
