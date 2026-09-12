export type AmountUnitKey = 'portion' | 'piece' | 'gram';

export interface AmountUnitConfig {
    /** Stepper increment. */
    step: number;
    min: number;
    max: number;
    initial: number;
    /**
     * Grams in one unit, used only for the «≈ 89г» hint beside the value.
     * The real conversion happens server-side — it knows what a serving of
     * this particular product weighs, and must do it the same for everyone.
     */
    grams: number;
}

/** Stepper presets per unit tab — «Порція | Штука | Грам» (Figma 435:16097). */
export const AMOUNT_UNITS: Record<AmountUnitKey, AmountUnitConfig> = {
    portion: { step: 0.5, min: 0.5, max: 20, initial: 1, grams: 250 },
    piece: { step: 1, min: 1, max: 100, initial: 1, grams: 100 },
    gram: { step: 50, min: 50, max: 10000, initial: 50, grams: 1 },
};

export const AMOUNT_UNIT_KEYS: AmountUnitKey[] = ['portion', 'piece', 'gram'];
