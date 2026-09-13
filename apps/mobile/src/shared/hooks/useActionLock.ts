import { useCallback, useEffect, useRef, useState } from 'react';

/** Key used when a screen has a single guarded action and nothing to tell apart. */
const SINGLE = 'action';

/**
 * How long a lock may be held before it frees itself.
 *
 * Deliberately longer than the HTTP client's own 30s timeout, so this never
 * opens a second window during a merely slow request — it only fires when a
 * request leaked and neither resolved nor rejected. That happens: a socket the
 * simulator has quietly dropped can leave a mutation pending forever, and
 * without this the control it guards stays dead until the screen remounts.
 */
const LEAK_MS = 45_000;

/**
 * Synchronous guard for a control that fires a mutation, plus the busy flag
 * the control needs to say so.
 *
 * `mutation.isPending` is not a guard. It only flips after React re-renders
 * and the handler closure is rebuilt, so two taps inside one frame — an
 * ordinary fast double-tap — both read the stale `false` and both fire. On a
 * POST that means two rows on the server.
 *
 * A ref answers immediately, which is the whole point; the state beside it
 * exists only so the button can show a spinner and stop taking presses.
 *
 * Keys make the lock per-item rather than per-screen: while one dish is being
 * logged, the others stay pressable.
 *
 * ```ts
 * const lock = useActionLock();
 *
 * if (!lock.acquire(dishId)) return;
 * logMeal.mutate(payload, { onSettled: () => lock.release(dishId) });
 * ```
 *
 * Release from `onSettled`, not `onSuccess` — a failed request has to unlock
 * too, or the control stays dead until the screen remounts. The exception is a
 * control that navigates away on success: leave it locked, so a late second
 * tap cannot fire into a screen that is already gone.
 */
export const useActionLock = () => {
    const inFlight = useRef(new Set<string>());
    const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
    const [busyKeys, setBusyKeys] = useState<string[]>([]);

    const release = useCallback((key: string = SINGLE) => {
        const timer = timers.current.get(key);
        if (timer) {
            clearTimeout(timer);
            timers.current.delete(key);
        }
        inFlight.current.delete(key);
        setBusyKeys(current => current.filter(item => item !== key));
    }, []);

    /** Takes the lock. `false` means someone already holds it — do nothing. */
    const acquire = useCallback(
        (key: string = SINGLE) => {
            if (inFlight.current.has(key)) return false;
            inFlight.current.add(key);
            setBusyKeys(current => (current.includes(key) ? current : [...current, key]));
            timers.current.set(
                key,
                setTimeout(() => release(key), LEAK_MS),
            );
            return true;
        },
        [release],
    );

    // Екран іде — таймери разом з ним.
    useEffect(
        () => () => {
            timers.current.forEach(clearTimeout);
            timers.current.clear();
        },
        [],
    );

    const isBusy = useCallback((key: string = SINGLE) => busyKeys.includes(key), [busyKeys]);

    return {
        acquire,
        release,
        isBusy,
        /** Anything at all in flight — for a screen-wide «Зберегти». */
        isAnyBusy: busyKeys.length > 0,
    };
};
