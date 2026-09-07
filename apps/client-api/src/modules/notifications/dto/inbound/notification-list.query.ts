import { createZodDto } from 'nestjs-zod';

import { notificationListQuerySchema } from '@dns/validation';

export class NotificationListQuery extends createZodDto(notificationListQuerySchema) {}
