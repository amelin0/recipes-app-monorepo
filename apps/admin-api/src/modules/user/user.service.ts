import { Injectable, NotFoundException } from '@nestjs/common';

import { AdminUserDetail, AdminUserListItem, AdminUserRepository, RefreshTokenRepository } from '@dns/database';
import { AdminUserListQuery } from '@dns/validation';

import { UserErrorCode } from './user.errors';

@Injectable()
export class AdminUserService {
    constructor(
        private readonly userRepository: AdminUserRepository,
        private readonly refreshTokenRepository: RefreshTokenRepository,
    ) {}

    list(query: AdminUserListQuery): Promise<{ items: AdminUserListItem[]; total: number }> {
        return this.userRepository.list({
            filters: {
                search: query.search,
                isBlocked: query.isBlocked,
                isEmailVerified: query.isEmailVerified,
                hasSubscription: query.hasSubscription,
                deletion: query.deletion,
            },
            page: query.page,
            limit: query.limit,
        });
    }

    async findById(id: string): Promise<AdminUserDetail> {
        const user = await this.userRepository.findById(id);
        if (!user) throw new NotFoundException({ message: 'User not found', code: UserErrorCode.NotFound });
        return user;
    }

    /**
     * Stops or restores an account (user-directory FR-005…FR-007).
     *
     * Two steps, and the order matters: raise the flag first, so a refresh
     * arriving between the statements meets an account that can no longer be
     * issued a session, instead of a live row whose tokens were just deleted.
     *
     * Unblocking is only the first step. The revoked sessions stay revoked —
     * restoring the ability to sign in is not the same as handing back the
     * sessions the block took away.
     */
    async setBlocked(id: string, blocked: boolean): Promise<void> {
        const updated = await this.userRepository.setBlocked(id, blocked);
        if (!updated) throw new NotFoundException({ message: 'User not found', code: UserErrorCode.NotFound });

        if (blocked) {
            await this.refreshTokenRepository.deleteAllForUser(id);
        }
    }

    /**
     * Cancels the user's own request to delete the account (FR-009).
     *
     * The panel offers no way to *execute* one: until ADR-0005 is accepted the
     * only deletion the schema can perform is a full cascade, which would take
     * subscriptions and referral links with it.
     */
    async cancelDeletionRequest(id: string): Promise<void> {
        await this.findById(id);

        const cancelled = await this.userRepository.cancelDeletionRequest(id);
        if (!cancelled) {
            throw new NotFoundException({
                message: 'This account has no pending deletion request',
                code: UserErrorCode.NoDeletionRequest,
            });
        }
    }
}
