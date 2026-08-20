import React from 'react';
import { ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppCard, AppScreen, AppText, NutritionSummaryRow, ScreenActions } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import TimerIcon from '../../../../assets/icons/timer.svg';
import MascotRecipeBook from '../../../../assets/images/brand/mascot-recipe-book.svg';

import { useDishCreatedScreen } from './useDishCreatedScreen';

const MASCOT_SIZE = 200;

/** Страву створено та додано у власні (628:27032). */
export const DishCreatedScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes']);
    const { dish, handleAddToRation, handleGoHome } = useDishCreatedScreen();

    return (
        <AppScreen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <MascotRecipeBook width={MASCOT_SIZE} height={MASCOT_SIZE} />
                <AppText variant="titleLarge" accessibilityRole="header" style={styles.centered}>
                    {t('recipes:dish-created.title')}
                </AppText>

                <AppCard style={styles.card}>
                    <View style={styles.cardHeader}>
                        <AppText variant="titleMedium" style={styles.centered}>
                            {dish.title}
                        </AppText>
                        <AppText variant="bodyMediumReg" style={[styles.centered, styles.muted]}>
                            {dish.cuisine}
                        </AppText>
                    </View>

                    <NutritionSummaryRow
                        calories={dish.kcal.toLocaleString('en-US')}
                        macros={{ protein: dish.protein, fats: dish.fats, carbs: dish.carbs }}
                        equalWidths
                    />

                    <AppText variant="bodyMediumReg">
                        {t('recipes:dish-created.weight', { value: dish.weightGrams })}
                    </AppText>

                    <View style={styles.timeBlock}>
                        <AppText variant="bodyMediumReg" style={styles.muted}>
                            {t('recipes:details.cook-time')}
                        </AppText>
                        <View style={styles.timerTag}>
                            <TimerIcon width={16} height={16} color={theme.colors.semantic.negative} />
                            <AppText variant="bodyMediumBold" style={styles.timerText}>
                                {dish.cookTime}
                            </AppText>
                        </View>
                    </View>
                </AppCard>
            </ScrollView>

            <ScreenActions>
                <AppButton fullWidth label={t('recipes:details.add-to-ration')} onPress={handleAddToRation} />
                <AppButton
                    fullWidth
                    variant="secondary"
                    label={t('recipes:dish-created.go-home')}
                    onPress={handleGoHome}
                />
            </ScreenActions>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[3],
        gap: theme.spacing[3],
    },
    centered: {
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    card: {
        gap: theme.spacing[4],
    },
    cardHeader: {
        alignItems: 'center',
        gap: theme.spacing[1],
        width: '100%',
    },
    timeBlock: {
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    timerTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[2],
        paddingVertical: theme.spacing[1],
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightNegative,
    },
    timerText: {
        color: theme.colors.semantic.negative,
    },
}));
