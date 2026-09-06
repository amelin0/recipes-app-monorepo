import { createZodDto } from 'nestjs-zod';

import { updateRemindersSchema } from '@dns/validation';

export class UpdateRemindersInboundDto extends createZodDto(updateRemindersSchema) {}
