import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppText, ValueStepper } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import CloseIcon from '../../../../assets/icons/close.svg';

import { useMetricAddScreen } from './useMetricAddScreen';

/** Units the sheet appends to the value, per metric. */
const UNIT_KEY = {
    weight: 'progress:units.kg',
    waist: 'progress:units.cm',
    height: 'progress:units.cm',
    steps: 'progress:units.steps-short',
    water: 'progress:units.ml',
} as const;

/**
 * Sheet for entering a number by hand — a reading you took (673:41245,
 * 673:42212, 673:42669) or the goal you are aiming at (673:49980, 673:50419,
 * 805:18701). Same control either way; the copy and the action differ.
 */
export const MetricAddScreen = () => {
    const { t } = useAppTranslation(['progress', 'common']);
    const { theme } = useUnistyles();
    const {
        metric,
        mode,
        isGoal,
        subtitleParams,
        value,
        setValue,
        isValid,
        canDecrease,
        handleDecrease,
        handleIncrease,
        handleClose,
        handleSave,
    } = useMetricAddScreen();

    return (
        <View style={styles.sheet}>
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <AppText variant="titleMedium">{t(`progress:${mode}-entry.${metric}.title`)}</AppText>
                    <AppText variant="bodyMediumReg" style={styles.muted}>
                        {t(`progress:${mode}-entry.${metric}.subtitle`, subtitleParams)}
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
                    value={`${value} ${t(UNIT_KEY[metric])}`}
                    onChangeValue={next =>
                        // The unit rides along in the field, so strip it back off.
                        setValue(next.replace(/[^\d.,]/g, ''))
                    }
                    canDecrease={canDecrease}
                    onDecrease={handleDecrease}
                    onIncrease={handleIncrease}
                    decreaseLabel={t('progress:entry.decrease-a11y')}
                    increaseLabel={t('progress:entry.increase-a11y')}
                />

                <AppButton
                    fullWidth
                    size="md"
                    label={t(isGoal ? 'progress:entry.save-goal' : 'progress:entry.save')}
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
