import { createZodDto } from 'nestjs-zod';

import { recipeListQuerySchema } from '@dns/validation';

export class RecipeListQuery extends createZodDto(recipeListQuerySchema) {}
