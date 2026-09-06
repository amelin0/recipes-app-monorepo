import { createZodDto } from 'nestjs-zod';

import { oauthSignInSchema } from '@dns/validation';

export class OAuthSignInInboundDto extends createZodDto(oauthSignInSchema) {}
