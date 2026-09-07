import { createZodDto } from 'nestjs-zod';

import { shoppingProductParamSchema } from '@dns/validation';

export class ShoppingProductParam extends createZodDto(shoppingProductParamSchema) {}
