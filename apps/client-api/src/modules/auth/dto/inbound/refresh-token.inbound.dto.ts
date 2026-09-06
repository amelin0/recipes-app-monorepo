import { createZodDto } from 'nestjs-zod';

import { refreshTokenSchema } from '@dns/validation';

export class RefreshTokenInboundDto extends createZodDto(refreshTokenSchema) {}
