import React, { useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppText, CircleIconButton } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import CheckIcon from '../../../../../assets/icons/check.svg';
import CloseIcon from '../../../../../assets/icons/close.svg';
import { CREATE_DISH_CUISINES, OPTION_EMOJI } from '../../recipe.constants';

export interface CuisineSheetProps {
    visible: boolean;
    selected: string;
    onApply: (key: string) => void;
    onClose: () => void;
}

/** Шторка «Кухня» — вибір країни походження страви (626:24661). */
export const CuisineSheet = ({ visible, selected, onApply, onClose }: CuisineSheetProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes', 'common']);
    const [draft, setDraft] = useState(selected);

    // Нове відкриття стартує з поточного вибору форми.
    useEffect(() => {
        if (visible) setDraft(selected);
    }, [visible, selected]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common:actions.close')}
                style={styles.scrim}
                onPress={onClose}
            />

            <View style={styles.sheet}>
                <View style={styles.header}>
                    <View style={styles.labels}>
                        <AppText variant="titleMedium" accessibilityRole="header">
                            {t('recipes:create-dish.cuisine-title')}
                        </AppText>
                        <AppText variant="bodyMediumReg" style={styles.subtitle}>
                            {t('recipes:create-dish.cuisine-subtitle')}
                        </AppText>
                    </View>
                    <CircleIconButton accessibilityLabel={t('common:actions.close')} onPress={onClose}>
                        <CloseIcon width={20} height={20} color={theme.colors.elements.primary} />
                    </CircleIconButton>
                </View>

                <View style={styles.options}>
                    {CREATE_DISH_CUISINES.map(key => {
                        const active = draft === key;
                        return (
                            <Pressable
                                key={key}
                                accessibilityRole="button"
                                accessibilityState={{ selected: active }}
                                onPress={() => setDraft(key)}
                                style={styles.option(active)}
                            >
                                <AppText variant="bodyLargeBold" style={styles.optionLabel}>
                                    {`${OPTION_EMOJI[key]} ${t(`recipes:options.${key}`)}`}
                                </AppText>
                                {active ? (
                                    <CheckIcon width={24} height={24} color={theme.colors.semantic.positive} />
                                ) : null}
                            </Pressable>
                        );
                    })}
                </View>

                <AppButton fullWidth label={t('recipes:create-dish.apply')} onPress={() => onApply(draft)} />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create(theme => ({
    scrim: {
        flex: 1,
        backgroundColor: theme.colors.background.overlay,
    },
    sheet: {
        borderTopLeftRadius: theme.radius.xl,
        borderTopRightRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.white,
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[6],
        paddingBottom: theme.spacing[10],
        gap: theme.spacing[4],
        ...theme.shadow.sheet,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[3],
    },
    labels: {
        flex: 1,
        gap: theme.spacing[1],
    },
    subtitle: {
        color: theme.colors.semantic.darkGrey,
    },
    options: {
        gap: theme.spacing[2],
    },
    option: (active: boolean) => ({
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        paddingHorizontal: theme.spacing[3],
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: active ? theme.colors.forms.positiveBorder : theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.semantic.white,
    }),
    optionLabel: {
        flex: 1,
    },
}));
