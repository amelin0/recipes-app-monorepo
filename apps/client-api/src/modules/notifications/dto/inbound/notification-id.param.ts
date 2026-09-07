import { createZodDto } from 'nestjs-zod';

import { notificationIdParamSchema } from '@dns/validation';

export class NotificationIdParam extends createZodDto(notificationIdParamSchema) {}
