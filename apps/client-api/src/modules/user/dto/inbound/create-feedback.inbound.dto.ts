import { createZodDto } from 'nestjs-zod';

import { createFeedbackSchema } from '@dns/validation';

export class CreateFeedbackInboundDto extends createZodDto(createFeedbackSchema) {}
