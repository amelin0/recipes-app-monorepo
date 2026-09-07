import { createZodDto } from 'nestjs-zod';

import { updateSettingsSchema } from '@dns/validation';

export class UpdateSettingsInboundDto extends createZodDto(updateSettingsSchema) {}
