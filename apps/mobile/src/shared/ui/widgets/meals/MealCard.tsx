import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppCard, AppText, GradientOutline } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import ArrowRightIcon from '../../../../../assets/icons/arrow-right.svg';

import { DishRow, type DishAction, type DishMacro, type DishSwipeAction } from './DishRow';

export interface MealDish {
    id: string;
    emoji: string;
    name: string;
    calories: number;
    macros: DishMacro[];
}

/** Matches AppCard's corner so the outline sits exactly on its edge. */
const CARD_RADIUS = 24;

export interface MealCardProps {
    title: string;
    /** Planned time (hidden when absent — e.g. Перекус). */
    time?: string;
    /** Planned dishes; an empty list falls back to «Не заплановано». */
    dishes?: MealDish[];
    /** Trailing action offered on every dish of this meal. @default 'none' */
    dishAction?: DishAction;
    /** Per-dish override of `dishAction` (e.g. basket vs basket-added, 435:13191). */
    resolveDishAction?: (dish: MealDish) => DishAction;
    /** Swipe-left action for every dish (the plan's delete, 435:13566). */
    dishSwipeAction?: DishSwipeAction;
    onDishSwipe?: (dishId: string) => void;
    /** Outlines the card — the design marks the meal happening now (435:6558). */
    highlighted?: boolean;
    /** Show the chevron next to the title (opens meal details). */
    onPress?: () => void;
    onAdd: () => void;
    onDishAction?: (dishId: string) => void;
}

export const MealCard = ({
    title,
    time,
    dishes,
    dishAction = 'none',
    resolveDishAction,
    dishSwipeAction,
    onDishSwipe,
    highlighted = false,
    onPress,
    onAdd,
    onDishAction,
}: MealCardProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['tracking']);

    return (
        <AppCard>
            {highlighted ? <GradientOutline radius={CARD_RADIUS} /> : null}

            <View style={styles.header}>
                <Pressable accessibilityRole={onPress ? 'button' : 'none'} disabled={!onPress} onPress={onPress}>
                    <View style={styles.titleRow}>
                        <AppText variant="bodyMediumBold">{title}</AppText>
                        {onPress ? (
                            <ArrowRightIcon width={12} height={12} color={theme.colors.elements.primary} />
                        ) : null}
                    </View>
                    {time ? (
                        <AppText variant="bodyMediumReg" style={styles.muted}>
                            {time}
                        </AppText>
                    ) : null}
                </Pressable>

                <Pressable accessibilityRole="button" hitSlop={8} onPress={onAdd}>
                    <AppText variant="bodySmallReg" style={styles.add}>
                        {t('tracking:home.add')}
                    </AppText>
                </Pressable>
            </View>

            {dishes?.length ? (
                dishes.map(dish => (
                    <DishRow
                        key={dish.id}
                        emoji={dish.emoji}
                        name={dish.name}
                        calories={t('tracking:home.kcal', { value: dish.calories })}
                        macros={dish.macros}
                        action={resolveDishAction ? resolveDishAction(dish) : dishAction}
                        onActionPress={onDishAction ? () => onDishAction(dish.id) : undefined}
                        swipeAction={dishSwipeAction}
                        onSwipePress={onDishSwipe ? () => onDishSwipe(dish.id) : undefined}
                    />
                ))
            ) : (
                <AppText variant="bodySmallReg" style={styles.muted}>
                    {t('tracking:home.not-planned')}
                </AppText>
            )}
        </AppCard>
    );
};

const styles = StyleSheet.create(theme => ({
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        width: '100%',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    add: {
        color: theme.colors.branding.accent,
    },
}));
