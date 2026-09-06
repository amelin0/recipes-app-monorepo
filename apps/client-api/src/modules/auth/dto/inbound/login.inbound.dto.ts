import { createZodDto } from 'nestjs-zod';

import { loginSchema } from '@dns/validation';

export class LoginInboundDto extends createZodDto(loginSchema) {}
