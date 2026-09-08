import { Module } from '@nestjs/common';

import { AdminUserRepository } from './admin-user.repository';

@Module({
    providers: [AdminUserRepository],
    exports: [AdminUserRepository],
})
export class AdminUserRepositoryModule {}
