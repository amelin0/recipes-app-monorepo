import { Module } from '@nestjs/common';

import { AdminRepository } from './admin.repository';

@Module({
    providers: [AdminRepository],
    exports: [AdminRepository],
})
export class AdminRepositoryModule {}
