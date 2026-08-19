import React from 'react';
import { Image, Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

import AddIcon from '../../../../../assets/icons/add.svg';
import CloseIcon from '../../../../../assets/icons/close.svg';

export interface PhotoPickerProps {
    /** Local uris of the attached photos. */
    photos: string[];
    /** Hides the add tile once the limit is reached. */
    maxPhotos: number;
    addLabel: string;
    addAccessibilityLabel: string;
    removeAccessibilityLabel: string;
    onAdd: () => void;
    onRemove: (uri: string) => void;
}

const TILE = 80;

/** Attached screenshots, up to `maxPhotos` (804:25490). */
export const PhotoPicker = ({
    photos,
    maxPhotos,
    addLabel,
    addAccessibilityLabel,
    removeAccessibilityLabel,
    onAdd,
    onRemove,
}: PhotoPickerProps) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.row}>
            {photos.map(uri => (
                <View key={uri} style={styles.tile}>
                    <Image source={{ uri }} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={removeAccessibilityLabel}
                        hitSlop={8}
                        onPress={() => onRemove(uri)}
                        style={styles.remove}
                    >
                        <CloseIcon width={8} height={8} color={theme.colors.semantic.white} />
                    </Pressable>
                </View>
            ))}

            {photos.length < maxPhotos ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={addAccessibilityLabel}
                    onPress={onAdd}
                    style={styles.add}
                >
                    <AddIcon width={20} height={20} color={theme.colors.semantic.darkGrey} />
                    <AppText variant="bodySmallReg" style={styles.addLabel}>
                        {addLabel}
                    </AppText>
                </Pressable>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[2],
    },
    tile: {
        width: TILE,
        height: TILE,
    },
    photo: {
        width: TILE,
        height: TILE,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
    },
    // The design hangs the remove button off the top-right corner (804:25493).
    remove: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 22,
        height: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        borderWidth: 2,
        borderColor: theme.colors.semantic.white,
        backgroundColor: theme.colors.semantic.negative,
    },
    add: {
        width: TILE,
        height: TILE,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[1],
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.semantic.darkGrey,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    addLabel: {
        color: theme.colors.semantic.darkGrey,
    },
}));
