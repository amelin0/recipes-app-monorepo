import { createZodDto } from 'nestjs-zod';

import { submitReceiptSchema } from '@dns/validation';

export class SubmitReceiptInboundDto extends createZodDto(submitReceiptSchema) {}
