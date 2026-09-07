import { createZodDto } from 'nestjs-zod';

import { adminRefreshSchema } from '@dns/validation';

export class AdminRefreshTokenInboundDto extends createZodDto(adminRefreshSchema) {}
