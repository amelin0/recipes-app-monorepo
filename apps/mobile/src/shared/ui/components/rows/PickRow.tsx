import React from 'react';
import { Pressable, View } from 'react-native';

import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useAppTranslation } from '@/shared/utils/translations';

import AddIcon from '../../../../../assets/icons/add.svg';
import TickCircleOutlineIcon from '../../../../../assets/icons/tick-circle-outline.svg';
import { MacroChipsRow } from '../nutrition';
import { AppText } from '../texts';

export interface PickRowProps {
    title: string;
    /** «350 ккал» line for dishes, «1 порція(30мл) 350 ккал» for ingredients. */
    subtitle: string;
    /** Pastel emoji thumb — absent on ingredient rows (594:30812). */
    emoji?: string;
    protein: number;
    fats: number;
    carbs: number;
    added?: boolean;
    onAdd: () => void;
    /** Тап по тілу рядка (не по «+») — наприклад, відкрити деталі страви. */
    onPress?: () => void;
}

/**
 * The design fills the thumb with `linear-gradient(131.82deg, …)` — the same
 * endpoints as DishRow's tile, expressed as bounding-box fractions (594:31448).
 */
const GRADIENT = { x1: '-0.056', y1: '0.055', x2: '1.056', y2: '0.945' };

/** Pickable dish/ingredient row with the trailing «+» / green tick (594:30155). */
export const PickRow = ({
    title,
    subtitle,
    emoji,
    protein,
    fats,
    carbs,
    added = false,
    onAdd,
    onPress,
}: PickRowProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['meal-plan']);

    const Row = onPress ? Pressable : View;

    return (
        <Row style={styles.row} {...(onPress ? { accessibilityRole: 'button' as const, onPress } : {})}>
            {emoji ? (
                <View style={styles.thumb}>
                    <Svg style={StyleSheet.absoluteFill}>
                        <Defs>
                            <LinearGradient id="pickThumb" {...GRADIENT}>
                                <Stop offset="0" stopColor={theme.colors.gradient.dishFrom} />
                                <Stop offset="1" stopColor={theme.colors.gradient.dishTo} />
                            </LinearGradient>
                        </Defs>
                        <Rect x="0" y="0" width="100%" height="100%" fill="url(#pickThumb)" />
                    </Svg>
                    <AppText style={styles.emoji}>{emoji}</AppText>
                </View>
            ) : null}
            <View style={[styles.body, emoji ? null : styles.bodyNoThumb]}>
                <AppText variant="bodySmallBold" numberOfLines={1}>
                    {title}
                </AppText>
                <AppText variant="bodySmallReg" style={styles.muted}>
                    {subtitle}
                </AppText>
                <MacroChipsRow size="md" protein={protein} fats={fats} carbs={carbs} />
            </View>
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ checked: added }}
                accessibilityLabel={t(added ? 'meal-plan:add-dish.added-a11y' : 'meal-plan:add-dish.add-a11y', {
                    name: title,
                })}
                hitSlop={8}
                onPress={onAdd}
                style={styles.action(added, emoji !== undefined)}
            >
                {added ? (
                    <TickCircleOutlineIcon width={20} height={20} color={theme.colors.semantic.positive} />
                ) : (
                    <AddIcon width={20} height={20} color={theme.colors.elements.primary} />
                )}
            </Pressable>
        </Row>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        width: '100%',
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightGrey,
        overflow: 'hidden',
    },
    thumb: {
        alignSelf: 'stretch',
        width: 68,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 30,
        lineHeight: 36,
    },
    body: {
        flex: 1,
        gap: theme.spacing[1],
        paddingVertical: theme.spacing[2],
    },
    bodyNoThumb: {
        paddingLeft: theme.spacing[4],
        paddingVertical: theme.spacing[4],
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    // Рядки без тумба тримають правий відступ 16 (594:42881), з тумбом — 12.
    action: (added: boolean, hasThumb: boolean) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: hasThumb ? theme.spacing[3] : theme.spacing[4],
        borderRadius: theme.radius.full,
        borderWidth: added ? 0 : 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: 'transparent',
    }),
}));
