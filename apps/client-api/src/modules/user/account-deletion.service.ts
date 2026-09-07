import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { ACCOUNT_DELETION_GRACE_DAYS } from '@dns/constants';
import { AccountDeletionRequestEntity, AccountDeletionRequestRepository } from '@dns/database';

import { UserErrorCode } from './user.errors';

const DAY_MS = 86_400_000;

@Injectable()
export class AccountDeletionService {
    constructor(private readonly requestRepository: AccountDeletionRequestRepository) {}

    findActive(userId: string): Promise<AccountDeletionRequestEntity | null> {
        return this.requestRepository.findActive(userId);
    }

    /**
     * Raises the request and nothing more. The session deliberately survives:
     * restoring the account (FR-005) is an authenticated call, and revoking
     * here would leave the user holding a recovery screen they cannot act on.
     */
    async request(userId: string): Promise<AccountDeletionRequestEntity> {
        const active = await this.requestRepository.findActive(userId);

        if (active) {
            throw new ConflictException({
                message: 'A deletion request is already pending',
                code: UserErrorCode.DeletionAlreadyRequested,
            });
        }

        return this.requestRepository.create(userId, new Date(Date.now() + ACCOUNT_DELETION_GRACE_DAYS * DAY_MS));
    }

    /** Cancels the countdown and hands the account back untouched (FR-005). */
    async cancel(userId: string): Promise<void> {
        const active = await this.requestRepository.findActive(userId);

        if (!active) {
            throw new NotFoundException({
                message: 'No pending deletion request',
                code: UserErrorCode.NoDeletionRequest,
            });
        }

        await this.requestRepository.cancel(active.id);
    }
}
