import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import AddIcon from '../../../../../assets/icons/add.svg';

export interface ProductRowProps {
    emoji: string;
    name: string;
    onPress: () => void;
}

/** Catalog row on «Додати продукт»: emoji + name + 44pt plus chip (950:54270). */
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
            <View style={styles.addChip}>
                <AddIcon width={20} height={20} color={theme.colors.elements.primary} />
            </View>
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
    // 44×44 кружечок Semantic/light grey з хайрлайном Forms/light border
    // (950:54270) — на світло-сірому рядку його тримає саме рамка.
    addChip: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
}));
