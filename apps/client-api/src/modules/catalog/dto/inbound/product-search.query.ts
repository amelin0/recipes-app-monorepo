import { createZodDto } from 'nestjs-zod';

import { productSearchQuerySchema } from '@dns/validation';

export class ProductSearchQuery extends createZodDto(productSearchQuerySchema) {}
