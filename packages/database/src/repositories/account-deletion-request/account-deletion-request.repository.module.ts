import { Module } from '@nestjs/common';

import { AccountDeletionRequestRepository } from './account-deletion-request.repository';

@Module({
    providers: [AccountDeletionRequestRepository],
    exports: [AccountDeletionRequestRepository],
})
export class AccountDeletionRequestRepositoryModule {}
