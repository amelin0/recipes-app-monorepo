import React from 'react';
import { Modal, Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText, CircleIconButton } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import CameraIcon from '../../../../../assets/icons/camera.svg';
import CloseIcon from '../../../../../assets/icons/close.svg';
import GalleryIcon from '../../../../../assets/icons/gallery.svg';

export interface AddImageSheetProps {
    visible: boolean;
    onPickPhoto: () => void;
    onTakePhoto: () => void;
    onClose: () => void;
}

/** Шторка «Додати зображення» — галерея або камера (594:32058). */
export const AddImageSheet = ({ visible, onPickPhoto, onTakePhoto, onClose }: AddImageSheetProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes', 'common']);

    const options = [
        { key: 'pick', label: t('recipes:create-dish.pick-photo'), Icon: GalleryIcon, onPress: onPickPhoto },
        { key: 'take', label: t('recipes:create-dish.take-photo'), Icon: CameraIcon, onPress: onTakePhoto },
    ];

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
                    <AppText variant="titleMedium" accessibilityRole="header" style={styles.title}>
                        {t('recipes:create-dish.image-title')}
                    </AppText>
                    <CircleIconButton accessibilityLabel={t('common:actions.close')} onPress={onClose}>
                        <CloseIcon width={20} height={20} color={theme.colors.elements.primary} />
                    </CircleIconButton>
                </View>

                <View style={styles.options}>
                    {options.map(({ key, label, Icon, onPress }) => (
                        <Pressable key={key} accessibilityRole="button" onPress={onPress} style={styles.option}>
                            <Icon width={24} height={24} color={theme.colors.elements.primary} />
                            <AppText variant="bodyLargeBold">{label}</AppText>
                        </Pressable>
                    ))}
                </View>
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
        alignItems: 'center',
        gap: theme.spacing[3],
    },
    title: {
        flex: 1,
    },
    options: {
        gap: theme.spacing[2],
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        minHeight: 56,
        paddingHorizontal: theme.spacing[3],
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.semantic.white,
    },
}));
