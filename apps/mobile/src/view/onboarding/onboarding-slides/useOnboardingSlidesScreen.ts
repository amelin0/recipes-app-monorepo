import { useCallback, useState } from 'react';
import { useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { router } from 'expo-router';

import { AppStorage } from '@/data/local/domains/app';

import { ONBOARDING_SLIDES } from '../onboarding.constants';

export const useOnboardingSlidesScreen = () => {
    const { width, height } = useWindowDimensions();
    const [index, setIndex] = useState(0);

    const handleScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            if (width <= 0) return;
            const next = Math.round(event.nativeEvent.contentOffset.x / width);
            setIndex(Math.min(Math.max(next, 0), ONBOARDING_SLIDES.length - 1));
        },
        [width],
    );

    // Either CTA ends onboarding for good — the user has seen the pitch and is
    // moving into the auth funnel, so it must not reappear on the next launch.
    const leaveOnboarding = useCallback((href: '/(app)/(auth)/sign-up' | '/(app)/(auth)/sign-in') => {
        AppStorage.saveOnboardingCompleted();
        router.replace(href);
    }, []);

    return {
        slides: ONBOARDING_SLIDES,
        width,
        height,
        index,
        handleScroll,
        handleCreateAccount: () => leaveOnboarding('/(app)/(auth)/sign-up'),
        handleSignIn: () => leaveOnboarding('/(app)/(auth)/sign-in'),
    };
};
