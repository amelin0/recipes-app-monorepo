import { Module } from '@nestjs/common';

import { PasswordResetPermitRepository } from './password-reset-permit.repository';

@Module({
    providers: [PasswordResetPermitRepository],
    exports: [PasswordResetPermitRepository],
})
export class PasswordResetPermitRepositoryModule {}
