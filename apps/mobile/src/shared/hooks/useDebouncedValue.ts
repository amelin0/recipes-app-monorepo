import { useEffect, useState } from 'react';

/**
 * Returns `value` delayed by `delayMs` — re-rendering with the
 * latest value once the user stops changing it for that long.
 *
 * Typical use: debouncing a search-input string before piping it
 * into a React-Query `queryKey` so each keystroke doesn't spawn
 * its own cache entry / network round-trip. The visible
 * `<TextInput>` still reads the raw, undebounced value so typing
 * stays snappy.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const handle = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(handle);
    }, [value, delayMs]);

    return debounced;
}
