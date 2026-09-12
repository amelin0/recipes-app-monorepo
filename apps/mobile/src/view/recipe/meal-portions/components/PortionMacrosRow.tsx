import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText, MacroBadge, macroPalette, type MacroKey } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

export interface PortionMacrosRowProps {
    kcal: number;
    protein: number;
    fats: number;
    carbs: number;
}

const ORDER: MacroKey[] = ['protein', 'fats', 'carbs'];

/**
 * КБЖВ of the selected portion: «ккал 842 Б 42г Ж 124г В 12г» (811:58874).
 * Чотири світло-сірі чипи; літера макроса — у спільному круглому бейджі 20×20,
 * калорійність — у пілюлі на Active/tertiary.
 */
export const PortionMacrosRow = ({ kcal, protein, fats, carbs }: PortionMacrosRowProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes', 'tracking']);
    const palette = macroPalette(theme.colors);
    const grams: Record<MacroKey, number> = { protein, fats, carbs };

    return (
        <View style={styles.row}>
            <View style={styles.chip}>
                <View style={styles.kcalBadge}>
                    <AppText variant="bodySmallReg">{t('recipes:details.kcal-label')}</AppText>
                </View>
                <AppText variant="bodySmallReg">{kcal.toLocaleString('en-US')}</AppText>
            </View>
            {ORDER.map(key => (
                <View key={key} style={styles.chip}>
                    <MacroBadge
                        letter={t(`tracking:home.macros.${key}`)}
                        color={palette[key].color}
                        backgroundColor={palette[key].backgroundColor}
                    />
                    <AppText variant="bodySmallReg">{t('recipes:portions.grams-value', { value: grams[key] })}</AppText>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        // Чотири чипи вміщаються в 343; wrap лишається запобіжником для
        // чотиризначних калорій на великому розмірі шрифту.
        flexWrap: 'wrap',
        gap: theme.spacing[2],
    },
    // Той самий 14pt чип, що й у зведенні страви (NutritionSummaryRow), але
    // щільніший — 4pt падінг, і кожен чип хугає свій вміст (811:58875).
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
        padding: theme.spacing[1],
        borderRadius: 14,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    kcalBadge: {
        height: 20,
        paddingHorizontal: theme.spacing[1],
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.active.tertiary,
    },
}));
