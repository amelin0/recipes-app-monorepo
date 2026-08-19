import React from 'react';
import { Pressable, View } from 'react-native';

import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import CutleryIcon from '../../../../../assets/icons/cutlery.svg';
import TickCircleOutlineIcon from '../../../../../assets/icons/tick-circle-outline.svg';

import { MacroBadge } from './MacroBadge';
import { macroPalette, type MacroKey } from './macro-palette';

/**
 * What the trailing button offers for this dish.
 *
 * - `eaten` — already logged; the row shows a green tick (950:54252).
 * - `eat` — the meal is happening now; the row offers the cutlery action
 *   (811:59006).
 * - `none` — a meal still ahead, which the design leaves without a button
 *   (435:6099).
 */
export type DishAction = 'eaten' | 'eat' | 'none';

export interface DishMacro {
    key: MacroKey;
    /** Grams of this macro in the dish. */
    value: number;
}

export interface DishRowProps {
    /** Illustrative emoji shown on the tinted tile. */
    emoji: string;
    name: string;
    /** Energy line under the name, already formatted («320 ккал»). */
    calories: string;
    macros: DishMacro[];
    /** @default 'none' */
    action?: DishAction;
    onActionPress?: () => void;
}

/** Gradient tile width — the design keeps it fixed while the row grows (435:6026). */
const TILE_WIDTH = 68;

/**
 * The design fills the tile with `linear-gradient(131.82deg, …)`. These are the
 * CSS gradient line's endpoints solved for the 68×76 tile and expressed as
 * bounding-box fractions, so react-native-svg reproduces the angle instead of
 * the corner-to-corner diagonal a plain 0,0 → 1,1 would give.
 */
const GRADIENT = { x1: '-0.056', y1: '0.055', x2: '1.056', y2: '0.945' };

/** One planned dish inside a meal card (435:6025). */
export const DishRow = ({ emoji, name, calories, macros, action = 'none', onActionPress }: DishRowProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['tracking']);
    const palette = macroPalette(theme.colors);

    return (
        <View style={styles.row}>
            <View style={styles.tile}>
                <Svg style={StyleSheet.absoluteFill}>
                    <Defs>
                        <LinearGradient id="dishTile" {...GRADIENT}>
                            <Stop offset="0" stopColor={theme.colors.gradient.dishFrom} />
                            <Stop offset="1" stopColor={theme.colors.gradient.dishTo} />
                        </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#dishTile)" />
                </Svg>
                <AppText style={styles.emoji}>{emoji}</AppText>
            </View>

            <View style={styles.info}>
                <AppText variant="bodySmallBold" style={styles.name}>
                    {name}
                </AppText>
                <AppText variant="bodySmallReg" style={styles.calories}>
                    {calories}
                </AppText>

                <View style={styles.macros}>
                    {macros.map(macro => (
                        <View key={macro.key} style={styles.macro}>
                            <MacroBadge
                                letter={t(`tracking:home.macros.${macro.key}`)}
                                color={palette[macro.key].color}
                                backgroundColor={palette[macro.key].backgroundColor}
                            />
                            <AppText variant="bodySmallReg">{macro.value}</AppText>
                        </View>
                    ))}
                </View>
            </View>

            {action === 'none' ? null : (
                <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ checked: action === 'eaten' }}
                    accessibilityLabel={t(action === 'eaten' ? 'tracking:home.dish-eaten' : 'tracking:home.dish-eat', {
                        name,
                    })}
                    disabled={!onActionPress}
                    onPress={onActionPress}
                    style={styles.action(action)}
                >
                    {action === 'eaten' ? (
                        <TickCircleOutlineIcon width={20} height={20} color={theme.colors.semantic.positive} />
                    ) : (
                        <CutleryIcon width={20} height={20} color={theme.colors.elements.primary} />
                    )}
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingRight: theme.spacing[3],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightGrey,
        overflow: 'hidden',
    },
    tile: {
        alignSelf: 'stretch',
        width: TILE_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 30,
        lineHeight: 36,
        letterSpacing: 0.3955,
    },
    info: {
        flex: 1,
        gap: theme.spacing[1],
        justifyContent: 'center',
        paddingVertical: theme.spacing[2],
    },
    name: {
        width: '100%',
    },
    calories: {
        color: theme.colors.semantic.darkGrey,
    },
    macros: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    macro: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    action: (action: DishAction) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightGrey,
        // Only the cutlery button is outlined — the tick reads as a state, not
        // as something to press again (950:54252 vs 811:59006).
        borderWidth: action === 'eat' ? 1 : 0,
        borderColor: theme.colors.forms.lightBorder,
    }),
}));
