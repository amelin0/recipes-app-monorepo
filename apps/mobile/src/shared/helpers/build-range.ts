/** Inclusive integer range, used to build the measure and time wheels. */
export const buildRange = (min: number, max: number): number[] =>
    Array.from({ length: max - min + 1 }, (_, i) => min + i);
