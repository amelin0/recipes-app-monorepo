import { createZodDto } from 'nestjs-zod';

import { mealPlanRangeSchema } from '@dns/validation';

export class MealPlanRangeQuery extends createZodDto(mealPlanRangeSchema) {}
