import { createZodDto } from 'nestjs-zod';

import { recipeIdParamSchema } from '@dns/validation';

export class RecipeIdParam extends createZodDto(recipeIdParamSchema) {}
