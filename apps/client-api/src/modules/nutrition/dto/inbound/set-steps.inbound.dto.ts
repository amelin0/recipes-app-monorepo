import { createZodDto } from 'nestjs-zod';

import { setStepsSchema } from '@dns/validation';

export class SetStepsInboundDto extends createZodDto(setStepsSchema) {}
