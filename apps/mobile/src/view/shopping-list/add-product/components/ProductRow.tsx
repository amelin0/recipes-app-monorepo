import React from 'react';
import { Pressable } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import AddIcon from '../../../../../assets/icons/add.svg';

export interface ProductRowProps {
    emoji: string;
    name: string;
    onPress: () => void;
}

/** Catalog row on «Додати продукт»: emoji + name + green plus. */
export const ProductRow = ({ emoji, name, onPress }: ProductRowProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['shopping']);

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('shopping:add.add-a11y', { name })}
            onPress={onPress}
            style={({ pressed }) => styles.row(pressed)}
        >
            <AppText style={styles.emoji}>{emoji}</AppText>
            <AppText variant="bodySmallBold" style={styles.name}>
                {name}
            </AppText>
            <AddIcon width={24} height={24} color={theme.colors.branding.accent} />
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    row: (pressed: boolean) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        padding: theme.spacing[4],
        borderRadius: theme.radius.lg,
        backgroundColor: pressed ? theme.colors.active.tertiary : theme.colors.semantic.lightGrey,
        width: '100%',
    }),
    emoji: {
        fontSize: 20,
        lineHeight: 25,
    },
    name: {
        flex: 1,
    },
}));
