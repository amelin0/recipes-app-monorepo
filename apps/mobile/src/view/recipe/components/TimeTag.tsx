import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface TimeTagProps {
    /** Ready-to-render label, e.g. «15 хв». */
    label: string;
    style?: StyleProp<ViewStyle>;
}

/** Red cook-time pill («15 хв») — meal details header and method steps. */
export const TimeTag = ({ label, style }: TimeTagProps) => {
    return (
        <View style={[styles.tag, style]}>
            <AppText variant="bodySmallBold" style={styles.label}>
                {label}
            </AppText>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    tag: {
        alignSelf: 'flex-start',
        paddingHorizontal: theme.spacing[2],
        paddingVertical: 2,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightNegative,
    },
    label: {
        color: theme.colors.semantic.negative,
    },
}));
