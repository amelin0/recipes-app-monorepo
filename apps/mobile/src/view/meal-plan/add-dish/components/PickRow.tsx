import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText, MacroChipsRow } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import AddIcon from '../../../../../assets/icons/add.svg';
import TickCircleOutlineIcon from '../../../../../assets/icons/tick-circle-outline.svg';

export interface PickRowProps {
    title: string;
    /** «350 ккал» line for dishes, «1 порція(30мл) 350 ккал» for ingredients. */
    subtitle: string;
    /** Pastel emoji thumb — absent on ingredient rows (594:30812). */
    emoji?: string;
    thumbBg?: string;
    protein: number;
    fats: number;
    carbs: number;
    added?: boolean;
    onAdd: () => void;
}

/** Pickable dish/ingredient row with the trailing «+» / green tick (594:30155). */
export const PickRow = ({
    title,
    subtitle,
    emoji,
    thumbBg,
    protein,
    fats,
    carbs,
    added = false,
    onAdd,
}: PickRowProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['meal-plan']);

    return (
        <View style={styles.row}>
            {emoji ? (
                <View style={[styles.thumb, { backgroundColor: thumbBg }]}>
                    <AppText style={styles.emoji}>{emoji}</AppText>
                </View>
            ) : null}
            <View style={[styles.body, emoji ? null : styles.bodyNoThumb]}>
                <AppText variant="bodySmallBold" numberOfLines={1}>
                    {title}
                </AppText>
                <AppText variant="bodySmallReg" style={styles.muted}>
                    {subtitle}
                </AppText>
                <MacroChipsRow size="md" protein={protein} fats={fats} carbs={carbs} />
            </View>
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ checked: added }}
                accessibilityLabel={t(added ? 'meal-plan:add-dish.added-a11y' : 'meal-plan:add-dish.add-a11y', {
                    name: title,
                })}
                hitSlop={8}
                onPress={onAdd}
                style={styles.action(added)}
            >
                {added ? (
                    <TickCircleOutlineIcon width={20} height={20} color={theme.colors.semantic.positive} />
                ) : (
                    <AddIcon width={20} height={20} color={theme.colors.elements.primary} />
                )}
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        width: '100%',
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightGrey,
        overflow: 'hidden',
    },
    thumb: {
        alignSelf: 'stretch',
        width: 68,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 30,
        lineHeight: 36,
    },
    body: {
        flex: 1,
        gap: theme.spacing[1],
        paddingVertical: theme.spacing[2],
    },
    bodyNoThumb: {
        paddingLeft: theme.spacing[4],
        paddingVertical: theme.spacing[4],
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    action: (added: boolean) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing[3],
        borderRadius: theme.radius.full,
        borderWidth: added ? 0 : 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: 'transparent',
    }),
}));
