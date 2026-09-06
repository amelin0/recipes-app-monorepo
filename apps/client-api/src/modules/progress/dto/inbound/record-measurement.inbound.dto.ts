import { createZodDto } from 'nestjs-zod';

import { recordMeasurementSchema } from '@dns/validation';

export class RecordMeasurementInboundDto extends createZodDto(recordMeasurementSchema) {}
