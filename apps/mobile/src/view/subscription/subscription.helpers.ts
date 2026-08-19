import type { SubscriptionPlan } from './subscription.constants';

/**
 * `$ 59,99` — the paywall's price format (911:52897): a leading dollar sign and
 * a decimal comma. The design writes the same amount without the space on the
 * success card («$9,99 / місяць»); one form is used everywhere here.
 */
export function formatPrice(amount: number): string {
    return `$ ${amount.toFixed(2).replace('.', ',')}`;
}

/** End of a billing period that starts on `start` and runs `months` long. */
export function addMonths(start: Date, months: number): Date {
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    return end;
}

/** Whole days between two dates — the subscription card's «Залишилось». */
export function daysBetween(from: Date, to: Date): number {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    return Math.max(0, Math.round((to.getTime() - from.getTime()) / MS_PER_DAY));
}

/** Charged today: zero while a referral covers the whole first period. */
export function chargedNow(plan: SubscriptionPlan, referralFreeMonths: number): number {
    return referralFreeMonths >= plan.months ? 0 : plan.price;
}
