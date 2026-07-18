import React from 'react';
import { Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppSwitch, AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { PortionMacrosRow, PortionStepperCard } from './components';
import { useMealPortionsScreen } from './useMealPortionsScreen';

export const MealPortionsScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes', 'common']);
    const {
        myPortions,
        othersPortions,
        forOthers,
        setForOthers,
        myGrams,
        othersGrams,
        totalGrams,
        myMacros,
        handleMyDecrease,
        handleMyIncrease,
        handleOthersDecrease,
        handleOthersIncrease,
        handleClose,
        handleStartCooking,
    } = useMealPortionsScreen();

    return (
        <View style={styles.sheet}>
            <View style={styles.headerBar}>
                <AppText variant="titleMedium" style={styles.headerTitle}>
                    {t('recipes:portions.title')}
                </AppText>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('common:actions.close')}
                    hitSlop={8}
                    onPress={handleClose}
                    style={styles.closeButton}
                >
                    <Ionicons name="close" size={24} color={theme.colors.elements.primary} />
                </Pressable>
            </View>

            {/* Контент короткий і статичний — ScrollView всередині formSheet
                зсувається системними інсетами під хедер, тому звичайний View. */}
            <View style={styles.content}>
                <AppText variant="bodyMediumReg" color="tertiary">
                    {t('recipes:portions.subtitle')}
                </AppText>

                <PortionStepperCard
                    title={t('recipes:portions.my-portion')}
                    portions={myPortions}
                    grams={myGrams}
                    onDecrease={handleMyDecrease}
                    onIncrease={handleMyIncrease}
                >
                    <PortionMacrosRow
                        kcal={myMacros.kcal}
                        protein={myMacros.protein}
                        fats={myMacros.fats}
                        carbs={myMacros.carbs}
                    />
                </PortionStepperCard>

                <View style={styles.othersRow}>
                    <AppText variant="bodyLargeBold">{t('recipes:portions.for-others')}</AppText>
                    <AppSwitch
                        value={forOthers}
                        onValueChange={setForOthers}
                        accessibilityLabel={t('recipes:portions.for-others-a11y')}
                    />
                </View>

                {forOthers ? (
                    <PortionStepperCard
                        title={t('recipes:portions.others-portion')}
                        portions={othersPortions}
                        grams={othersGrams}
                        onDecrease={handleOthersDecrease}
                        onIncrease={handleOthersIncrease}
                    />
                ) : null}
            </View>

            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <AppText variant="bodyLargeBold">{t('recipes:portions.total-weight')}</AppText>
                    <AppText variant="bodyLargeBold">
                        {t('recipes:portions.grams-value', { value: totalGrams })}
                    </AppText>
                </View>
                <AppButton fullWidth label={t('recipes:portions.start-cooking')} onPress={handleStartCooking} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    sheet: {
        flex: 1,
        backgroundColor: theme.colors.semantic.white,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[5],
        paddingBottom: theme.spacing[2],
    },
    headerTitle: {
        flex: 1,
    },
    closeButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[4],
        gap: theme.spacing[4],
    },
    othersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing[3],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    footer: {
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[2],
        paddingBottom: theme.spacing[6],
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
}));
