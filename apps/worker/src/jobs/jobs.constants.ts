/** One queue, named jobs inside it — two queues for two nightly sweeps is ceremony. */
export const JOBS_QUEUE = 'maintenance';

export const JobName = {
    ExpiredRows: 'expired-rows',
    SubscriptionExpiry: 'subscription-expiry',
} as const;

export type JobName = (typeof JobName)[keyof typeof JobName];
