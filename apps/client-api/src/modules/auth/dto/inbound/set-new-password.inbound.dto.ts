import { createZodDto } from 'nestjs-zod';

import { setNewPasswordSchema } from '@dns/validation';

export class SetNewPasswordInboundDto extends createZodDto(setNewPasswordSchema) {}
