import { createZodDto } from 'nestjs-zod';

import { adminLoginSchema } from '@dns/validation';

export class AdminLoginInboundDto extends createZodDto(adminLoginSchema) {}
