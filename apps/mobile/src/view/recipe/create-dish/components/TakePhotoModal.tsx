import React from 'react';
import { Image, Modal, Pressable, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import CloseIcon from '../../../../../assets/icons/close.svg';
import { MOCK_CREATE_DISH_PHOTO } from '../../recipe.constants';

export interface TakePhotoModalProps {
    visible: boolean;
    onSave: () => void;
    onClose: () => void;
}

/** «Зробіть фото» — мок камери з готовим знімком (594:32413). */
// TODO: справжня камера через expo-image-picker, коли модуль додадуть у dev-client.
export const TakePhotoModal = ({ visible, onSave, onClose }: TakePhotoModalProps) => {
    const { theme } = useUnistyles();
    const insets = useSafeAreaInsets();
    const { t } = useAppTranslation(['recipes', 'common']);

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.screen}>
                <View style={[styles.topBar, { paddingTop: insets.top + theme.spacing[2] }]}>
                    <View style={styles.side}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t('common:actions.close')}
                            hitSlop={8}
                            onPress={onClose}
                            style={styles.closeButton}
                        >
                            <CloseIcon width={20} height={20} color={theme.colors.elements.primary} />
                        </Pressable>
                    </View>
                    <AppText variant="bodyLargeBold" style={styles.title}>
                        {t('recipes:create-dish.take-photo-title')}
                    </AppText>
                    <View style={[styles.side, styles.sideEnd]}>
                        <Pressable accessibilityRole="button" onPress={onSave} style={styles.saveButton}>
                            <AppText variant="bodyMediumBold" numberOfLines={1}>
                                {t('common:actions.save')}
                            </AppText>
                        </Pressable>
                    </View>
                </View>
                <Image
                    source={MOCK_CREATE_DISH_PHOTO}
                    accessibilityLabel={t('recipes:create-dish.photo-a11y')}
                    style={styles.photo}
                    resizeMode="cover"
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create(theme => ({
    screen: {
        flex: 1,
        backgroundColor: theme.colors.semantic.white,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[2],
    },
    // Рівні фланги тримають заголовок по центру (594:32417).
    side: {
        width: 90,
        flexDirection: 'row',
    },
    sideEnd: {
        justifyContent: 'flex-end',
    },
    closeButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        flex: 1,
        textAlign: 'center',
    },
    saveButton: {
        minHeight: 44,
        paddingHorizontal: theme.spacing[3],
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.white30,
    },
    photo: {
        flex: 1,
        width: '100%',
    },
}));
