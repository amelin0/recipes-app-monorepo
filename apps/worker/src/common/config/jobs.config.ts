import { registerAs } from '@nestjs/config';

import { JobsConfig } from './config.type';

/**
 * When the jobs run, and how far ahead the subscription warning looks.
 *
 * The two sweeps are nightly and deliberately off the hour: every other timer
 * on a shared host fires at :00, and three jobs plus two backup scripts
 * starting together is how a four-core machine gets a load spike nobody can
 * attribute.
 *
 * The counting job is hourly instead, because it feeds a gauge: nightly would
 * mean a number up to a day old, and an alert reading a stale number is worse
 * than no alert. It costs two `count(*)` on an indexed table.
 */
export default registerAs<JobsConfig>('jobs', () => ({
    cleanupCron: process.env.JOBS_CLEANUP_CRON ?? '17 3 * * *',
    subscriptionCron: process.env.JOBS_SUBSCRIPTION_CRON ?? '23 4 * * *',
    pendingWorkCron: process.env.JOBS_PENDING_WORK_CRON ?? '7 * * * *',
    expiringWithinDays: parseInt(process.env.JOBS_EXPIRING_WITHIN_DAYS ?? '3', 10),
}));
