import assert from 'node:assert/strict';
import { test } from 'node:test';

import { NotificationEvent } from '@dns/shared-types';

import { notificationTemplate } from './notification-templates';
import { REFERRAL_REWARD } from './subscription';

test('the reward message names a single month because the reward is a single month', () => {
    // The text says «місяць» outright. If the reward grows, this fails and
    // the wording has to be rewritten with it, rather than quietly
    // under-promising what was granted.
    assert.equal(REFERRAL_REWARD.freeMonths, 1);

    const uk = notificationTemplate(NotificationEvent.ReferralRewarded, 'uk', { subject: '12 жовтня 2026 р.' });
    assert.match(`${uk?.title} ${uk?.body}`, /місяць/);
    assert.match(uk?.body ?? '', /12 жовтня 2026 р\./);
});

test('the redemption message still promises nothing', () => {
    // Redeeming earns nothing; the month comes with the friend's first payment.
    for (const language of ['uk', 'en']) {
        const template = notificationTemplate(NotificationEvent.ReferralRedeemed, language);
        assert.doesNotMatch(`${template?.title} ${template?.body}`, /місяц|month/i);
    }
});
