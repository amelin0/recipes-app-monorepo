import React from 'react';
import { Modal, Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import CloseIcon from '../../../../../assets/icons/close.svg';
import { AppButton } from '../buttons';
import { AppText } from '../texts';

export interface ConfirmSheetProps {
    visible: boolean;
    title: string;
    description?: string;
    /** Primary action, e.g. «Зберегти зміни». */
    confirmLabel: string;
    onConfirm: () => void;
    /** Secondary action, e.g. «Продовжити без змін». */
    cancelLabel: string;
    onCancel: () => void;
    /** Closing the sheet without choosing — the × and the scrim. */
    onDismiss: () => void;
    closeAccessibilityLabel: string;
}

/**
 * Bottom sheet that asks before something is lost — RFDS 811:37517. Rendered
 * in place rather than as a route so the screen keeps its unsaved state.
 */
export const ConfirmSheet = ({
    visible,
    title,
    description,
    confirmLabel,
    onConfirm,
    cancelLabel,
    onCancel,
    onDismiss,
    closeAccessibilityLabel,
}: ConfirmSheetProps) => {
    const { theme } = useUnistyles();

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={closeAccessibilityLabel}
                style={styles.scrim}
                onPress={onDismiss}
            />

            <View style={styles.sheet}>
                <View style={styles.header}>
                    <View style={styles.labels}>
                        <AppText variant="titleMedium" accessibilityRole="header">
                            {title}
                        </AppText>
                        {description ? (
                            <AppText variant="bodyMediumReg" style={styles.description}>
                                {description}
                            </AppText>
                        ) : null}
                    </View>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={closeAccessibilityLabel}
                        hitSlop={8}
                        onPress={onDismiss}
                        style={styles.close}
                    >
                        <CloseIcon width={20} height={20} color={theme.colors.elements.primary} />
                    </Pressable>
                </View>

                <View style={styles.actions}>
                    <AppButton label={confirmLabel} onPress={onConfirm} fullWidth />
                    <AppButton variant="secondary" label={cancelLabel} onPress={onCancel} fullWidth />
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
        width: '100%',
        borderTopLeftRadius: theme.radius.xl,
        borderTopRightRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.white,
        ...theme.shadow.sheet,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[6],
        paddingBottom: theme.spacing[4],
    },
    labels: {
        flex: 1,
        minWidth: 0,
        gap: theme.spacing[1],
    },
    description: {
        color: theme.colors.semantic.darkGrey,
    },
    close: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    actions: {
        width: '100%',
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[10],
    },
}));
