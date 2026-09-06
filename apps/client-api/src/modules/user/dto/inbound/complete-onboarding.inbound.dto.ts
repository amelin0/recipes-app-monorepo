import { createZodDto } from 'nestjs-zod';

import { completeOnboardingSchema } from '@dns/validation';

export class CompleteOnboardingInboundDto extends createZodDto(completeOnboardingSchema) {}
