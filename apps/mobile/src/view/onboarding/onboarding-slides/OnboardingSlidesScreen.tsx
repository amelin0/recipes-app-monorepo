import React from 'react';
import { Image, ScrollView, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppScreen, PageDots } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import {
    DESIGN_FRAME_WIDTH,
    SLIDE_BOTTOM_CHROME,
    SLIDE_IMAGE_SIZE,
    SLIDE_TOP_OFFSET,
    TITLE_BOX_HEIGHT,
} from '../onboarding.constants';

import { HighlightedTitle } from './components';
import { useOnboardingSlidesScreen } from './useOnboardingSlidesScreen';

export const OnboardingSlidesScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const insets = useSafeAreaInsets();
    const { slides, width, height, index, handleScroll, handleCreateAccount, handleSignIn } =
        useOnboardingSlidesScreen();

    // Scale the illustration with the viewport so it keeps the design's 80%-of-width
    // presence on larger phones, but never let it exceed the height left over after
    // the fixed chrome — on a 375x667 phone the width-derived size would not fit and
    // the pager, being the only shrinkable row, would clip the artwork.
    const widthBased = (width * SLIDE_IMAGE_SIZE) / DESIGN_FRAME_WIDTH;
    const heightBased = height - insets.top - SLIDE_TOP_OFFSET - TITLE_BOX_HEIGHT - SLIDE_BOTTOM_CHROME;
    const imageSize = Math.round(Math.max(Math.min(widthBased, heightBased), SLIDE_IMAGE_SIZE / 2));

    return (
        <AppScreen>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                style={styles.pager}
            >
                {slides.map(slide => (
                    <View key={slide.key} style={[styles.page, { width }]}>
                        <View style={styles.titleBox}>
                            <HighlightedTitle
                                title={t(`onboarding:slides.${slide.key}.title`)}
                                highlight={slide.highlight}
                            />
                        </View>
                        <Image
                            source={slide.image}
                            style={{ width: imageSize, height: imageSize }}
                            resizeMode="contain"
                        />
                    </View>
                ))}
            </ScrollView>

            <View style={styles.spacer} />

            <PageDots
                count={slides.length}
                activeIndex={index}
                size="lg"
                accessibilityLabel={t('onboarding:a11y.slides', { current: index + 1, total: slides.length })}
            />

            <View style={styles.footer}>
                <AppButton
                    fullWidth
                    style={styles.cta}
                    label={t('onboarding:actions.create-account')}
                    onPress={handleCreateAccount}
                />
                <AppButton
                    fullWidth
                    variant="secondary"
                    style={styles.cta}
                    label={t('onboarding:actions.sign-in')}
                    onPress={handleSignIn}
                />
            </View>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    pager: {
        flexGrow: 0,
        // Without this the horizontal ScrollView is the only shrinkable row and
        // absorbs every overflow, clipping the slide instead of the spacer giving way.
        flexShrink: 0,
        marginTop: SLIDE_TOP_OFFSET,
    },
    page: {
        alignItems: 'center',
    },
    titleBox: {
        // Keeps the illustration on the same baseline across slides, and still
        // grows if a translation needs a third line.
        minHeight: TITLE_BOX_HEIGHT,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[4],
        width: '100%',
    },
    // Absorbs the extra height of taller phones; on the 375×812 reference frame
    // it resolves to exactly the design's 64pt gap under the illustration.
    spacer: {
        flex: 1,
    },
    // The onboarding frame stretches the RFDS large button (52) to 56.
    cta: {
        minHeight: 56,
    },
    footer: {
        gap: theme.spacing[4],
        marginTop: theme.spacing[20],
        paddingHorizontal: theme.spacing[4],
        // Design keeps the CTA 40pt off the physical bottom, clearing the home
        // indicator on its own — so the screen does not pad the bottom edge.
        paddingBottom: theme.spacing[10],
    },
}));
