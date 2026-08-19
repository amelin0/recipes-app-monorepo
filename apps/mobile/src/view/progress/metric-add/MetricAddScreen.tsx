import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppText, ValueStepper } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import CloseIcon from '../../../../assets/icons/close.svg';

import { useMetricAddScreen } from './useMetricAddScreen';

/** Sheet for logging a reading by hand (673:41245, 673:42212, 673:42669). */
export const MetricAddScreen = () => {
    const { t } = useAppTranslation(['progress', 'common']);
    const { theme } = useUnistyles();
    const { metric, value, setValue, isValid, canDecrease, handleDecrease, handleIncrease, handleClose, handleSave } =
        useMetricAddScreen();

    return (
        <View style={styles.sheet}>
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <AppText variant="titleMedium">{t(`progress:add.${metric}.title`)}</AppText>
                    <AppText variant="bodyMediumReg" style={styles.muted}>
                        {t(`progress:add.${metric}.subtitle`)}
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

            <View style={styles.body}>
                <ValueStepper
                    value={`${value} ${t(`progress:units.${metric === 'weight' ? 'kg' : 'cm'}`)}`}
                    onChangeValue={next =>
                        // The unit rides along in the field, so strip it back off.
                        setValue(next.replace(/[^\d.,]/g, ''))
                    }
                    canDecrease={canDecrease}
                    onDecrease={handleDecrease}
                    onIncrease={handleIncrease}
                    decreaseLabel={t('progress:add.decrease-a11y')}
                    increaseLabel={t('progress:add.increase-a11y')}
                />

                <AppButton
                    fullWidth
                    size="md"
                    label={t('progress:add.save')}
                    disabled={!isValid}
                    onPress={handleSave}
                />
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
    body: {
        gap: theme.spacing[4],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        paddingBottom: theme.spacing[6],
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
}));
