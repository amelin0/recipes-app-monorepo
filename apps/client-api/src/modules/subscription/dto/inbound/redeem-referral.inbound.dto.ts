import { createZodDto } from 'nestjs-zod';

import { redeemReferralSchema } from '@dns/validation';

export class RedeemReferralInboundDto extends createZodDto(redeemReferralSchema) {}
