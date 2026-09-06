import { createZodDto } from 'nestjs-zod';

import { updateProfileSchema } from '@dns/validation';

export class UpdateProfileInboundDto extends createZodDto(updateProfileSchema) {}
