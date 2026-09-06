import { createZodDto } from 'nestjs-zod';

import { saveOnboardingStepSchema } from '@dns/validation';

export class SaveOnboardingStepInboundDto extends createZodDto(saveOnboardingStepSchema) {}
