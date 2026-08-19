import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton } from '@/shared/ui/components';

import AddIcon from '../../../../assets/icons/add.svg';

export interface MetricAction {
    key: string;
    label: string;
    onPress: () => void;
}

export interface MetricActionsProps {
    /** Grey pills sharing the row evenly. */
    actions: MetricAction[];
    /** Trailing round «+», when the metric can be added to. */
    onAdd?: () => void;
    addLabel?: string;
    /** Renders the single action as an outlined accent button instead. */
    outlined?: boolean;
}

/** Action row at the foot of a metric card (670:26747, 673:49812). */
export const MetricActions = ({ actions, onAdd, addLabel, outlined = false }: MetricActionsProps) => {
    const { theme } = useUnistyles();

    if (outlined) {
        return (
            <View style={styles.row}>
                {actions.map(action => (
                    <AppButton
                        key={action.key}
                        variant="secondary"
                        size="md"
                        label={action.label}
                        onPress={action.onPress}
                        style={[styles.grow, styles.outlined]}
                    />
                ))}
            </View>
        );
    }

    return (
        <View style={styles.row}>
            {actions.map(action => (
                <AppButton
                    key={action.key}
                    variant="secondary"
                    size="md"
                    label={action.label}
                    onPress={action.onPress}
                    style={styles.grow}
                />
            ))}

            {onAdd ? (
                <Pressable accessibilityRole="button" accessibilityLabel={addLabel} onPress={onAdd} style={styles.add}>
                    <AddIcon width={20} height={20} color={theme.colors.semantic.white} />
                </Pressable>
            ) : null}
        </View>
    );
};

const BUTTON = 44;

const styles = StyleSheet.create(theme => ({
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    grow: {
        flex: 1,
        minWidth: 0,
    },
    // Same light-grey pill as the other actions, ringed in accent — the label
    // stays Elements/primary (670:26913).
    outlined: {
        borderWidth: 1,
        borderColor: theme.colors.branding.accent,
    },
    add: {
        width: BUTTON,
        height: BUTTON,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.branding.accent,
    },
}));
