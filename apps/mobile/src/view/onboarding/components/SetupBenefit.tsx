import React from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen } from '@/shared/ui/components';
import type { TypographyVariant } from '@/shared/ui/theme';

import { SetupFooter } from './SetupFooter';
import { SetupHeader } from './SetupHeader';
import { SetupProgress } from './SetupProgress';

export interface SetupBenefitProps {
    /** 1-based index of the step in the questionnaire. */
    step: number;
    /** Exported illustration; omit when passing `graphic`. */
    illustration?: ImageSourcePropType;
    /** Aspect ratio of the illustration as exported from Figma. */
    aspectRatio?: number;
    /** Rendered illustration, for the step whose art has to stay localizable. */
    graphic?: React.ReactNode;
    /**
     * The plan illustration carries a soft shadow that overflows the content
     * column, so it is rendered full-bleed instead of inside the 16pt padding.
     */
    bleed?: boolean;
    title: string;
    subtitle: string;
    subtitleVariant?: TypographyVariant;
    onNext: () => void;
}

/**
 * Shared shell for the illustrated pitch steps inside the questionnaire —
 * RF-mobile-app 864:111837, 864:111963, 864:114912. They ask nothing, so the
 * footer is a single stretched CTA with no way back.
 */
export const SetupBenefit = ({
    step,
    illustration,
    aspectRatio,
    graphic,
    bleed = false,
    title,
    subtitle,
    subtitleVariant,
    onNext,
}: SetupBenefitProps) => {
    return (
        <AppScreen>
            <SetupProgress step={step} />

            <View style={styles.content}>
                {graphic ?? (
                    <Image
                        source={illustration}
                        style={[styles.illustration(aspectRatio ?? 1), bleed ? styles.bleed : null]}
                        resizeMode="contain"
                        accessibilityIgnoresInvertColors
                    />
                )}

                <SetupHeader title={title} subtitle={subtitle} subtitleVariant={subtitleVariant} />
            </View>

            <SetupFooter canProceed onNext={onNext} fullWidth />
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: theme.spacing[4],
        paddingTop: 72,
        gap: theme.spacing[6],
    },
    illustration: (aspectRatio: number) => ({
        width: '100%',
        aspectRatio,
    }),
    bleed: {
        alignSelf: 'stretch',
        marginHorizontal: -theme.spacing[4],
    },
}));
