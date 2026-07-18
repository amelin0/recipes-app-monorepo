import React from 'react';
import { ImageBackground, Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import HeartIcon from '../../../../assets/icons/heart.svg';
import TimerIcon from '../../../../assets/icons/timer.svg';
import type { MockRecipe } from '../recipe.constants';

import { MacroChipsRow } from './MacroChipsRow';

export interface RecipeCardProps {
    recipe: MockRecipe;
    /** grid — two-column tile; list — full-width tall card. */
    variant: 'grid' | 'list';
    onPress: () => void;
    onToggleFavorite: () => void;
}

/** Recipe card — RFDS grid tile (476:11678) / list card (476:11455). */
export const RecipeCard = ({ recipe, variant, onPress, onToggleFavorite }: RecipeCardProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes']);
    const isList = variant === 'list';

    return (
        <Pressable accessibilityRole="button" onPress={onPress} style={styles.card(isList)}>
            <ImageBackground source={recipe.image} style={styles.image(isList)} resizeMode="cover">
                <View style={styles.imageOverlayRow}>
                    <View style={styles.timePill}>
                        <TimerIcon width={16} height={16} color={theme.colors.elements.primary} />
                        <AppText variant="bodySmallReg">{t('recipes:list.minutes', { count: recipe.minutes })}</AppText>
                    </View>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('recipes:list.favorite-a11y')}
                        accessibilityState={{ selected: recipe.isFavorite }}
                        hitSlop={8}
                        onPress={onToggleFavorite}
                        style={styles.heartButton}
                    >
                        <HeartIcon
                            width={18}
                            height={18}
                            color={recipe.isFavorite ? theme.colors.semantic.negative : theme.colors.elements.primary}
                        />
                    </Pressable>
                </View>
            </ImageBackground>

            <View style={styles.body}>
                <AppText variant={isList ? 'bodyLargeBold' : 'bodyMediumBold'} numberOfLines={isList ? 1 : 3}>
                    {recipe.title}
                </AppText>
                {isList ? (
                    <MacroChipsRow
                        protein={recipe.protein}
                        fats={recipe.fats}
                        carbs={recipe.carbs}
                        kcal={recipe.kcal}
                    />
                ) : (
                    <>
                        <View style={styles.kcalBadge}>
                            <AppText variant="bodySmallReg" style={styles.kcalText}>
                                {t('recipes:list.kcal', { count: recipe.kcal })}
                            </AppText>
                        </View>
                        <MacroChipsRow protein={recipe.protein} fats={recipe.fats} carbs={recipe.carbs} />
                    </>
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    card: (isList: boolean) => ({
        flexGrow: isList ? 0 : 1,
        flexBasis: isList ? 'auto' : '46%',
        width: isList ? '100%' : undefined,
        minWidth: isList ? undefined : 140,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.semantic.lightGrey,
        overflow: 'hidden',
        ...theme.shadow.block,
    }),
    image: (isList: boolean) => ({
        height: isList ? 148 : 100,
        width: '100%',
        padding: theme.spacing[2],
        backgroundColor: theme.colors.semantic.darkGrey,
    }),
    imageOverlayRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        width: '100%',
    },
    timePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
        padding: theme.spacing[1],
        borderRadius: theme.radius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    heartButton: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    body: {
        padding: theme.spacing[2],
        gap: theme.spacing[1],
        alignItems: 'flex-start',
    },
    kcalBadge: {
        height: 20,
        paddingHorizontal: theme.spacing[1],
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.semantic.darkGrey,
    },
    kcalText: {
        color: theme.colors.semantic.white,
    },
}));
