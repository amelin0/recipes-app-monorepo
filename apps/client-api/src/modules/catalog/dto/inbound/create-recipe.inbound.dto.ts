import { createZodDto } from 'nestjs-zod';

import { createRecipeSchema } from '@dns/validation';

export class CreateRecipeInboundDto extends createZodDto(createRecipeSchema) {}
