import React from 'react';
import { Pressable } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useAppTranslation } from '@/shared/utils/translations';

import AddIcon from '../../../../../assets/icons/add.svg';

export interface AddRecipeTileProps {
    /** list view stretches the tile to the full column width (design 626:9706 shows grid only). */
    fullWidth?: boolean;
    onPress: () => void;
}

/** Dashed «add own recipe» tile closing the Власні grid (626:9706). */
export const AddRecipeTile = ({ fullWidth = false, onPress }: AddRecipeTileProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes']);

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('recipes:list.add-recipe-a11y')}
            onPress={onPress}
            style={styles.tile(fullWidth)}
        >
            <AddIcon width={36} height={36} color={theme.colors.branding.primary} />
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    tile: (fullWidth: boolean) => ({
        // Half a column even when it is alone in the last grid row (626:9706).
        flexGrow: 0,
        flexBasis: fullWidth ? 'auto' : '48.25%',
        width: fullWidth ? '100%' : undefined,
        minWidth: fullWidth ? undefined : 140,
        height: 214,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.semantic.lightGrey,
        ...theme.shadow.block,
    }),
}));
