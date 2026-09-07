import { createZodDto } from 'nestjs-zod';

import { createProductSchema } from '@dns/validation';

export class CreateProductInboundDto extends createZodDto(createProductSchema) {}
