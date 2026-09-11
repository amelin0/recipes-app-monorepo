import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { NotificationsProducer } from '@dns/api-common';
import { ACCOUNT_DELETION_GRACE_DAYS } from '@dns/constants';
import { AccountDeletionRequestEntity, AccountDeletionRequestRepository } from '@dns/database';
import { NotificationEvent } from '@dns/shared-types';

import { UserErrorCode } from './user.errors';

const DAY_MS = 86_400_000;

@Injectable()
export class AccountDeletionService {
    constructor(
        private readonly requestRepository: AccountDeletionRequestRepository,
        private readonly notifications: NotificationsProducer,
    ) {}

    findActive(userId: string): Promise<AccountDeletionRequestEntity | null> {
        return this.requestRepository.findActive(userId);
    }

    /**
     * Raises the request and nothing more. The session deliberately survives:
     * restoring the account (FR-005) is an authenticated call, and revoking
     * here would leave the user holding a recovery screen they cannot act on.
     */
    async request(userId: string): Promise<AccountDeletionRequestEntity> {
        // No «is one pending?» read first: the partial unique index answers
        // that inside the insert, which is the only place two taps in flight
        // cannot both get past it.
        const request = await this.requestRepository.createIfNoneActive(
            userId,
            new Date(Date.now() + ACCOUNT_DELETION_GRACE_DAYS * DAY_MS),
        );

        if (!request) {
            throw new ConflictException({
                message: 'A deletion request is already pending',
                code: UserErrorCode.DeletionAlreadyRequested,
            });
        }

        // The one message here that is not a courtesy: it carries the date the
        // account disappears, and the way back while it still exists. Reached
        // only by the request that was actually written, so a double tap
        // produces one message, not two with dates a millisecond apart.
        await this.notifications.emit(userId, NotificationEvent.AccountDeletionRequested, {
            date: request.scheduledFor,
        });

        return request;
    }

    /**
     * Cancels the countdown and hands the account back untouched (FR-005).
     *
     * One conditional update over every active row, so no request can survive
     * the cancel and still erase the account later; the message goes out only
     * when that update changed something.
     */
    async cancel(userId: string): Promise<void> {
        const cancelled = await this.requestRepository.cancelActive(userId);

        if (!cancelled) {
            throw new NotFoundException({
                message: 'No pending deletion request',
                code: UserErrorCode.NoDeletionRequest,
            });
        }

        await this.notifications.emit(userId, NotificationEvent.AccountDeletionCancelled);
    }
}
