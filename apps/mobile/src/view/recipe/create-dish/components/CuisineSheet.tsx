import React, { useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import Animated, { SlideInDown } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppText, CircleIconButton } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import type { Reference } from '@/data';

import CheckIcon from '../../../../../assets/icons/check.svg';
import CloseIcon from '../../../../../assets/icons/close.svg';

export interface CuisineSheetProps {
    visible: boolean;
    /** Cuisines as the catalogue lists them — names and emoji come with them. */
    options: Reference[];
    selected: string | null;
    onApply: (id: string) => void;
    onClose: () => void;
}

/** Шторка «Кухня» — вибір країни походження страви (626:24661). */
export const CuisineSheet = ({ visible, options, selected, onApply, onClose }: CuisineSheetProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes', 'common']);
    const [draft, setDraft] = useState<string | null>(selected);

    // Нове відкриття стартує з поточного вибору форми.
    useEffect(() => {
        if (visible) setDraft(selected);
    }, [visible, selected]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common:actions.close')}
                style={styles.scrim}
                onPress={onClose}
            />

            <Animated.View entering={SlideInDown.duration(280)} style={styles.sheet}>
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
                    {options.map(option => {
                        const active = draft === option.id;
                        return (
                            <Pressable
                                key={option.id}
                                accessibilityRole="button"
                                accessibilityState={{ selected: active }}
                                onPress={() => setDraft(option.id)}
                                style={styles.option(active)}
                            >
                                <AppText variant="bodyLargeBold" style={styles.optionLabel}>
                                    {option.emoji ? `${option.emoji} ${option.name}` : option.name}
                                </AppText>
                                {active ? (
                                    <CheckIcon width={24} height={24} color={theme.colors.semantic.positive} />
                                ) : null}
                            </Pressable>
                        );
                    })}
                </View>

                <AppButton
                    fullWidth
                    disabled={draft === null}
                    label={t('recipes:create-dish.apply')}
                    onPress={() => draft && onApply(draft)}
                />
            </Animated.View>
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
