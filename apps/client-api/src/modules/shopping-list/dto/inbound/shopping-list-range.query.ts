import { createZodDto } from 'nestjs-zod';

import { shoppingListRangeSchema } from '@dns/validation';

export class ShoppingListRangeQuery extends createZodDto(shoppingListRangeSchema) {}
