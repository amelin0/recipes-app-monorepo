import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

import TickIcon from '../../../../../assets/icons/check-small.svg';

export interface DaySelectRowProps {
    name: string;
    date: string;
    selected: boolean;
    onPress: () => void;
}

/** Selectable day of the copy sheet — green border + check when picked (435:14669). */
export const DaySelectRow = ({ name, date, selected, onPress }: DaySelectRowProps) => {
    const { theme } = useUnistyles();

    return (
        <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            onPress={onPress}
            style={styles.row(selected)}
        >
            <View style={styles.texts}>
                <AppText variant="bodyLargeBold">{name}</AppText>
                <AppText variant="bodySmallReg" style={styles.date}>
                    {date}
                </AppText>
            </View>
            {selected ? <TickIcon width={24} height={24} color={theme.colors.semantic.positive} /> : null}
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    row: (selected: boolean) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        // The 61pt design row minus the centred 1px border (326:19205 pattern).
        paddingVertical: theme.spacing[3] - 1,
        paddingHorizontal: theme.spacing[3],
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: selected ? theme.colors.semantic.positive : theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.background.screen,
    }),
    texts: {},
    date: {
        color: theme.colors.semantic.darkGrey,
    },
}));
