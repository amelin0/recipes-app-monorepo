import { createZodDto } from 'nestjs-zod';

import { registerSchema } from '@dns/validation';

export class RegisterInboundDto extends createZodDto(registerSchema) {}
