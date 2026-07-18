import React from 'react';
import { View } from 'react-native';

import Svg, { Path } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export interface AppCheckboxProps {
    checked: boolean;
}

/**
 * Round checkbox — RFDS `Checkbox` (node 318:17538/17540): 20px circle,
 * checked = Branding/primary fill + white check. Presentational only —
 * wrap in a Pressable with `accessibilityRole="checkbox"` for interaction.
 */
export const AppCheckbox = ({ checked }: AppCheckboxProps) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.circle(checked)}>
            {checked ? (
                <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                    <Path
                        d="M2.9 7.35L5.4 9.85L11.1 4.15"
                        stroke={theme.colors.semantic.white}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </Svg>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    circle: (checked: boolean) => ({
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: checked ? theme.colors.branding.primary : theme.colors.semantic.darkGrey,
        backgroundColor: checked ? theme.colors.branding.primary : theme.colors.semantic.white,
    }),
}));
