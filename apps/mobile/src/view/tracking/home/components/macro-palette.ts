import type { colors } from '@/shared/ui/theme';

export type MacroKey = 'protein' | 'fats' | 'carbs';

type ThemeColors = typeof colors;

/**
 * Tint of each macro badge, and the fill of its progress bar in the daily-goal
 * card. The badge tint and the bar colour are deliberately unrelated: the badge
 * identifies the macro, the bar reports how the day is going (476:13408).
 */
export const macroPalette = (c: ThemeColors) =>
    ({
        protein: {
            color: c.semantic.negative,
            backgroundColor: c.semantic.lightNegative,
            barColor: c.semantic.positive,
        },
        fats: { color: c.semantic.positive, backgroundColor: c.semantic.lightPositive, barColor: c.semantic.orange },
        carbs: { color: c.semantic.ocean, backgroundColor: c.semantic.lightOcean, barColor: c.semantic.negative },
    }) as const satisfies Record<MacroKey, { color: string; backgroundColor: string; barColor: string }>;
