import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import type { AdminUserDetail, AdminUserListItem } from '@dns/database';
import { adminSetUserBlockedSchema, adminUserListQuerySchema } from '@dns/validation';

export class UserListQueryDto extends createZodDto(adminUserListQuerySchema) {}
export class SetUserBlockedInboundDto extends createZodDto(adminSetUserBlockedSchema) {}

/** One row of the user directory. */
export class AdminUserView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;
    @ApiProperty({ example: 'someone@example.com' }) readonly email: string;

    @ApiProperty({ nullable: true, description: 'Null until the questionnaire is started.' })
    readonly name: string | null;

    @ApiProperty({ nullable: true, example: 'uk' }) readonly language: string | null;
    @ApiProperty() readonly isEmailVerified: boolean;

    @ApiProperty({ nullable: true, description: 'Set means staff stopped the account.' })
    readonly blockedAt: string | null;

    @ApiProperty() readonly hasActiveSubscription: boolean;

    @ApiProperty({ nullable: true, description: 'When the account is due to be erased, if asked for.' })
    readonly deletionScheduledFor: string | null;

    @ApiProperty() readonly createdAt: string;

    protected constructor(row: AdminUserListItem) {
        this.id = row.id;
        this.email = row.email;
        this.name = row.name;
        this.language = row.language;
        this.isEmailVerified = row.emailVerifiedAt !== null;
        this.blockedAt = row.blockedAt?.toISOString() ?? null;
        this.hasActiveSubscription = row.hasActiveSubscription;
        this.deletionScheduledFor = row.deletionScheduledFor?.toISOString() ?? null;
        this.createdAt = row.createdAt.toISOString();
    }

    static from(row: AdminUserListItem): AdminUserView {
        return new AdminUserView(row);
    }
}

class SubscriptionView {
    @ApiProperty({ example: 'active' }) readonly status: string;
    @ApiProperty({ example: 'premium-year' }) readonly planSlug: string;
    @ApiProperty({ example: 'purchase' }) readonly source: string;
    @ApiProperty() readonly startedAt: string;
    @ApiProperty() readonly expiresAt: string;

    constructor(subscription: NonNullable<AdminUserDetail['subscription']>) {
        this.status = subscription.status;
        this.planSlug = subscription.planSlug;
        this.source = subscription.source;
        this.startedAt = subscription.startedAt.toISOString();
        this.expiresAt = subscription.expiresAt.toISOString();
    }
}

class ActivityView {
    @ApiProperty() readonly ownRecipes: number;
    @ApiProperty() readonly favorites: number;

    @ApiProperty({ nullable: true, description: 'Last session issued or refreshed — not the last API call.' })
    readonly lastSeenAt: string | null;

    constructor(activity: AdminUserDetail['activity']) {
        this.ownRecipes = activity.ownRecipes;
        this.favorites = activity.favorites;
        this.lastSeenAt = activity.lastSeenAt?.toISOString() ?? null;
    }
}

class DeletionRequestView {
    @ApiProperty() readonly scheduledFor: string;
    @ApiProperty() readonly requestedAt: string;

    @ApiProperty({ description: 'The grace period has passed and nothing has run — see ADR-0005.' })
    readonly isOverdue: boolean;

    constructor(request: NonNullable<AdminUserDetail['deletionRequest']>) {
        this.scheduledFor = request.scheduledFor.toISOString();
        this.requestedAt = request.createdAt.toISOString();
        this.isOverdue = request.scheduledFor.getTime() <= Date.now();
    }
}

/**
 * The card behind a row.
 *
 * The questionnaire is deliberately absent: gender, weight, height, goal and
 * the daily targets are medically sensitive, and none of the work this screen
 * exists for — find an account, stop an account, sort out a deletion request —
 * needs any of them (user-directory FR-004).
 */
export class AdminUserDetailView extends AdminUserView {
    @ApiProperty({ isArray: true, example: ['password', 'apple'] })
    readonly signInMethods: string[];

    @ApiProperty({ type: SubscriptionView, nullable: true })
    readonly subscription: SubscriptionView | null;

    @ApiProperty({ type: ActivityView })
    readonly activity: ActivityView;

    @ApiProperty({ type: DeletionRequestView, nullable: true })
    readonly deletionRequest: DeletionRequestView | null;

    private constructor(user: AdminUserDetail) {
        super(user);
        this.signInMethods = user.signInMethods;
        this.subscription = user.subscription ? new SubscriptionView(user.subscription) : null;
        this.activity = new ActivityView(user.activity);
        this.deletionRequest = user.deletionRequest ? new DeletionRequestView(user.deletionRequest) : null;
    }

    static fromDetail(user: AdminUserDetail): AdminUserDetailView {
        return new AdminUserDetailView(user);
    }
}
