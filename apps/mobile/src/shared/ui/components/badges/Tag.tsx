import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '../texts';

/**
 * RFDS `tag` tones. `neutral` is the outlined chip used for ingredient lists
 * (984:57614); the coloured ones are solid tints (984:57618, 911:56914).
 */
export type TagTone = 'neutral' | 'negative' | 'positive' | 'orange' | 'ocean';

export interface TagProps {
    label: string;
    /** @default 'neutral' */
    tone?: TagTone;
    style?: StyleProp<ViewStyle>;
}

/** Small rounded label — cook time, ingredient names, «Реф. код». */
export const Tag = ({ label, tone = 'neutral', style }: TagProps) => {
    const { theme } = useUnistyles();

    const palette = {
        neutral: { color: theme.colors.elements.primary, backgroundColor: theme.colors.background.elements },
        negative: { color: theme.colors.semantic.negative, backgroundColor: theme.colors.semantic.lightNegative },
        positive: { color: theme.colors.semantic.positive, backgroundColor: theme.colors.semantic.lightPositive },
        orange: { color: theme.colors.semantic.orange, backgroundColor: theme.colors.semantic.lightOrange },
        ocean: { color: theme.colors.semantic.ocean, backgroundColor: theme.colors.semantic.lightOcean },
    }[tone];

    return (
        <View style={[styles.tag(tone, palette.backgroundColor), style]}>
            <AppText variant="bodySmallBold" style={{ color: palette.color }}>
                {label}
            </AppText>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    tag: (tone: TagTone, backgroundColor: string) => ({
        alignSelf: 'flex-start',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[2],
        paddingVertical: 2,
        borderRadius: theme.radius.full,
        backgroundColor,
        // Only the neutral chip is outlined; the tinted ones carry their colour
        // in the fill alone.
        borderWidth: tone === 'neutral' ? 1 : 0,
        borderColor: theme.colors.forms.border,
    }),
}));
