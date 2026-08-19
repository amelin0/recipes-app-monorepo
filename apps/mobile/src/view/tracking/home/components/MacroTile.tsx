import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText, MacroBadge, macroPalette, ProgressBar, type MacroKey } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

export interface MacroTileProps {
    macroKey: MacroKey;
    current: number;
    target: number;
}

/** One macro column under the gauge — badge, consumed/target, progress (476:13409). */
export const MacroTile = ({ macroKey, current, target }: MacroTileProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['tracking']);
    const palette = macroPalette(theme.colors)[macroKey];
    const progress = target > 0 ? current / target : 0;

    return (
        <View style={styles.tile}>
            <View style={styles.info}>
                <MacroBadge
                    letter={t(`tracking:home.macros.${macroKey}`)}
                    color={palette.color}
                    backgroundColor={palette.backgroundColor}
                />
                <AppText variant="bodySmallReg">
                    {current}/{target}
                    <AppText style={styles.unit}>{t('tracking:home.grams')}</AppText>
                </AppText>
            </View>
            <ProgressBar progress={progress} color={palette.barColor} height={3} />
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    tile: {
        flex: 1,
        padding: theme.spacing[2],
        gap: theme.spacing[1],
        borderRadius: 14,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    info: {
        gap: theme.spacing[1],
        width: '100%',
    },
    unit: {
        fontSize: 9,
        lineHeight: 12,
    },
}));
