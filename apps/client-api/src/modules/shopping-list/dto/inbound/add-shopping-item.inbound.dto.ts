import { createZodDto } from 'nestjs-zod';

import { addShoppingItemSchema } from '@dns/validation';

export class AddShoppingItemInboundDto extends createZodDto(addShoppingItemSchema) {}
