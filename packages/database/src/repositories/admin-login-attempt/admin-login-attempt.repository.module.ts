import { Module } from '@nestjs/common';

import { AdminLoginAttemptRepository } from './admin-login-attempt.repository';

@Module({
    providers: [AdminLoginAttemptRepository],
    exports: [AdminLoginAttemptRepository],
})
export class AdminLoginAttemptRepositoryModule {}
