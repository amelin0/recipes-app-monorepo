import { createZodDto } from 'nestjs-zod';

import { upsertNutritionGoalSchema } from '@dns/validation';

export class UpsertNutritionGoalInboundDto extends createZodDto(upsertNutritionGoalSchema) {}
