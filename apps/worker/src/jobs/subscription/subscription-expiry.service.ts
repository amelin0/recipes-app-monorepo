import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NotificationDedupeKey, NotificationsProducer } from '@dns/api-common';
import { SubscriptionRepository } from '@dns/database';
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
 * notice. The purchase and redemption transactions sweep the single account
 * they write to — enough to keep the unique index honest, and no help at all
 * to the person whose premium quietly stopped.
 */
@Injectable()
export class SubscriptionExpiryService {
    private readonly logger = new Logger(SubscriptionExpiryService.name);

    constructor(
        private readonly subscriptions: SubscriptionRepository,
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

        // Only the rows this run actually moved. The list above is a moment
        // old: somebody who re-purchased in that moment has had their lapsed
        // row swept by the purchase, and must not be told their subscription
        // has just ended. An overlapping run is the same case — whoever
        // changed the row is the one who tells.
        const changed = new Set(await this.subscriptions.markExpired(lapsed.map(row => row.id), now));

        for (const row of lapsed) {
            if (!changed.has(row.id)) continue;

            await this.producer.emit(row.userId, NotificationEvent.SubscriptionExpired, {
                date: row.expiresAt,
                // Belt and braces: `changed` already makes this once-only, and
                // the key keeps it so if a retry ever re-emits for a row.
                dedupeKey: NotificationDedupeKey.subscriptionExpired(row.id),
            });
        }

        return changed.size;
    }

    /**
     * Warns about the ones about to run out — once, not once a day.
     *
     * The job runs nightly and the window is three days wide, so the same
     * subscription qualifies three nights running, and a retried or
     * overlapping run qualifies it twice in one night. «Once» is the dedupe
     * key's unique index, not a look at the inbox beforehand: two runs that
     * both looked would both have found nothing and both have written.
     *
     * The key is the subscription **and its end date** — a referral reward
     * can move the date of the same row, and the new date deserves its own
     * warning.
     */
    private async warnExpiringSoon(now: Date): Promise<number> {
        const days = this.configService.getOrThrow('jobs.expiringWithinDays', { infer: true });
        const horizon = new Date(now.getTime() + days * DAY_MS);

        const soon = await this.subscriptions.findExpiringBetween(now, horizon);
        let warned = 0;

        for (const row of soon) {
            const written = await this.producer.emit(row.userId, NotificationEvent.SubscriptionExpiring, {
                date: row.expiresAt,
                dedupeKey: NotificationDedupeKey.subscriptionExpiring(row.id, row.expiresAt),
            });

            if (written) warned++;
        }

        return warned;
    }
}
