import { Module } from '@nestjs/common';

import { ReferenceRepository } from './reference.repository';

@Module({
    providers: [ReferenceRepository],
    exports: [ReferenceRepository],
})
export class ReferenceRepositoryModule {}
