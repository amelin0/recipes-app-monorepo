import { createZodDto } from 'nestjs-zod';

import {
    adminBulkDeleteRecipesSchema,
    adminCreateRecipeSchema,
    adminRecipeListQuerySchema,
    adminUpdateRecipeSchema,
} from '@dns/validation';

export class CreateRecipeInboundDto extends createZodDto(adminCreateRecipeSchema) {}
export class UpdateRecipeInboundDto extends createZodDto(adminUpdateRecipeSchema) {}
export class RecipeListQueryDto extends createZodDto(adminRecipeListQuerySchema) {}
export class BulkDeleteRecipesInboundDto extends createZodDto(adminBulkDeleteRecipesSchema) {}
