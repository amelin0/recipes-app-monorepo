import { SetMetadata } from '@nestjs/common';

export const THROTTLE_KEY = 'THROTTLE_KEY';

/**
 * Attaches a named rate-limit rule to a route. The rule's ttl and limit are
 * resolved from config at `throttler.rules.<key>`, so thresholds move through
 * env without touching the controller.
 */
export const SetThrottleKey = <TKey extends string>(key: TKey): ReturnType<typeof SetMetadata> =>
    SetMetadata(THROTTLE_KEY, key);
