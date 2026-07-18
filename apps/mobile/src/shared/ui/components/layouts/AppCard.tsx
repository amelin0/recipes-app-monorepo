import React from 'react';
import { View, type ViewProps } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

export type AppCardProps = ViewProps;

/** White rounded card with the RFDS `shadow/block` elevation (Home cards etc.). */
export const AppCard = ({ style, children, ...rest }: AppCardProps) => {
    return (
        <View style={[styles.card, style]} {...rest}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    card: {
        width: '100%',
        padding: theme.spacing[4],
        gap: theme.spacing[2],
        // Figma card containers are items-center: fixed-size children (gauge)
        // and standalone text ("Не заплановано") sit centered; full-width rows
        // set width: '100%' themselves.
        alignItems: 'center',
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.background.screen,
        ...theme.shadow.block,
    },
}));
