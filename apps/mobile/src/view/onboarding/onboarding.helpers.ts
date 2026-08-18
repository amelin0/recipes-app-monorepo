import { CM_PER_INCH, KG_PER_LB } from './onboarding.constants';

/** Inclusive integer range, used to build the measure wheels. */
export const buildRange = (min: number, max: number): number[] =>
    Array.from({ length: max - min + 1 }, (_, i) => min + i);

export const kgToLb = (kg: number) => Math.round(kg / KG_PER_LB);
export const lbToKg = (lb: number) => Number((lb * KG_PER_LB).toFixed(1));

export const cmToInch = (cm: number) => Math.round(cm / CM_PER_INCH);
export const inchToCm = (inch: number) => Number((inch * CM_PER_INCH).toFixed(1));

/** Nearest index in `items`, so a converted value still lands on a real row. */
export const nearestIndex = (items: number[], value: number): number => {
    let best = 0;
    let bestDistance = Infinity;
    items.forEach((item, index) => {
        const distance = Math.abs(item - value);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = index;
        }
    });
    return best;
};
