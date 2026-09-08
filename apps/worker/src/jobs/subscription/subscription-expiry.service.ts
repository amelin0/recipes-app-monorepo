import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NotificationsProducer } from '@dns/api-common';
import { NotificationRepository, SubscriptionRepository } from '@dns/database';
import { NotificationEvent } from '@dns/shared-types';

import { AllConfig } from '../../common/config';

export interface ExpiryReport {
    expired: number;
    warned: number;
}

const DAY_MS = 86_400_000;

/**
 * Turns a date into an event.
 *
 * A subscription's end is the one thing in this system that happens without
 * anybody doing anything, so it is the one thing an HTTP request cannot
 * notice. `SubscriptionRepository.expireLapsed` sweeps a single account at the
 * moment it tries to buy again — enough to keep the unique index honest, and
 * no help at all to the person whose premium quietly stopped.
 */
@Injectable()
export class SubscriptionExpiryService {
    private readonly logger = new Logger(SubscriptionExpiryService.name);

    constructor(
        private readonly subscriptions: SubscriptionRepository,
        private readonly notifications: NotificationRepository,
        private readonly producer: NotificationsProducer,
        private readonly configService: ConfigService<AllConfig>,
    ) {}

    async run(now: Date = new Date()): Promise<ExpiryReport> {
        const expired = await this.expireLapsed(now);
        const warned = await this.warnExpiringSoon(now);

        this.logger.log({ msg: 'swept subscriptions', expired, warned });

        return { expired, warned };
    }

    /**
     * Marks the ones whose date has passed, then tells their owners.
     *
     * The write comes first on purpose: if the process dies between the two,
     * the account is correctly out of premium and merely uninformed. The other
     * order would tell someone their subscription ended while it was still
     * marked active — and the next request would hand it back.
     */
    private async expireLapsed(now: Date): Promise<number> {
        const lapsed = await this.subscriptions.findLapsed(now);
        if (lapsed.length === 0) return 0;

        await this.subscriptions.markExpired(lapsed.map(row => row.id));

        for (const row of lapsed) {
            await this.producer.emit(row.userId, NotificationEvent.SubscriptionExpired, { date: row.expiresAt });
        }

        return lapsed.length;
    }

    /**
     * Warns about the ones about to run out — once, not once a day.
     *
     * The job runs nightly and the window is three days wide, so the same
     * subscription qualifies three nights running. Whether we already spoke is
     * read from the inbox itself rather than from a «notified» column: the
     * notification is the record, and a second flag could disagree with it.
     */
    private async warnExpiringSoon(now: Date): Promise<number> {
        const days = this.configService.getOrThrow('jobs.expiringWithinDays', { infer: true });
        const horizon = new Date(now.getTime() + days * DAY_MS);

        const soon = await this.subscriptions.findExpiringBetween(now, horizon);
        let warned = 0;

        for (const row of soon) {
            const alreadySaid = await this.notifications.existsForUserSince(
                row.userId,
                NotificationEvent.SubscriptionExpiring,
                new Date(row.expiresAt.getTime() - days * DAY_MS),
            );

            if (alreadySaid) continue;

            await this.producer.emit(row.userId, NotificationEvent.SubscriptionExpiring, { date: row.expiresAt });
            warned++;
        }

        return warned;
    }
}
