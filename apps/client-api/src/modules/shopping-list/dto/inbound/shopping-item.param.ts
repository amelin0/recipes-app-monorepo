import { createZodDto } from 'nestjs-zod';

import { shoppingItemParamSchema } from '@dns/validation';

export class ShoppingItemParam extends createZodDto(shoppingItemParamSchema) {}
