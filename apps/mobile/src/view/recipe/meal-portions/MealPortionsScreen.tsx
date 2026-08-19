import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppText, ValueStepper } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import CloseIcon from '../../../../assets/icons/close.svg';

import { PortionDial, PortionLegend, PortionMacrosRow } from './components';
import { useMealPortionsScreen } from './useMealPortionsScreen';

export const MealPortionsScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes', 'common']);
    const {
        image,
        portions,
        canDecrease,
        share,
        setShare,
        myMacros,
        totalGrams,
        handleDecrease,
        handleIncrease,
        handleClose,
        handleConfirm,
    } = useMealPortionsScreen();

    return (
        <View style={styles.sheet}>
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <AppText variant="titleMedium">{t('recipes:portions.title')}</AppText>
                    <AppText variant="bodyMediumReg" style={styles.muted}>
                        {t('recipes:portions.subtitle')}
                    </AppText>
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('common:actions.close')}
                    hitSlop={8}
                    onPress={handleClose}
                    style={styles.closeButton}
                >
                    <CloseIcon width={20} height={20} color={theme.colors.elements.primary} />
                </Pressable>
            </View>

            {/* The sheet is nearly full height in the design (811:58844); on a
                short device the plate plus its readouts still overflow, so the
                middle scrolls while the header and the action stay put. */}
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                <ValueStepper
                    value={t('recipes:portions.count', { value: portions })}
                    canDecrease={canDecrease}
                    onDecrease={handleDecrease}
                    onIncrease={handleIncrease}
                    decreaseLabel={t('recipes:portions.decrease-a11y')}
                    increaseLabel={t('recipes:portions.increase-a11y')}
                />

                <AppText variant="bodyMediumReg" style={[styles.centered, styles.muted]}>
                    {t('recipes:portions.hint')}
                </AppText>

                <PortionDial
                    share={share}
                    onShareChange={setShare}
                    image={image}
                    accessibilityLabel={t('recipes:portions.dial-a11y')}
                />

                <PortionLegend
                    mineLabel={t('recipes:portions.legend-mine')}
                    othersLabel={t('recipes:portions.legend-others')}
                />

                <PortionMacrosRow
                    kcal={myMacros.kcal}
                    protein={myMacros.protein}
                    fats={myMacros.fats}
                    carbs={myMacros.carbs}
                />
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.weightRow}>
                    <AppText variant="bodyMediumBold">{t('recipes:portions.total-weight')}</AppText>
                    <AppText variant="bodyMediumBold">
                        {t('recipes:portions.grams-value', { value: totalGrams })}
                    </AppText>
                </View>
                <AppButton fullWidth label={t('recipes:portions.confirm')} onPress={handleConfirm} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    sheet: {
        flex: 1,
        backgroundColor: theme.colors.semantic.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[6],
    },
    headerText: {
        flex: 1,
        gap: theme.spacing[1],
    },
    closeButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    list: {
        flexGrow: 1,
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
    },
    centered: {
        width: '100%',
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    footer: {
        gap: theme.spacing[4],
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[10],
    },
    weightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
}));
