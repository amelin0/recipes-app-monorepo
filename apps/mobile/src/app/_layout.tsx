import '@/shared/utils/translations';

import React, { useEffect, useState } from 'react';

import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black_Italic,
} from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RNToast from 'react-native-toast-message';
import { StyleSheet } from 'react-native-unistyles';

import { queryClient, toastConfig } from '@/shared/services';
import { AppSplash } from '@/shared/ui/widgets';

SplashScreen.preventAutoHideAsync();

/**
 * Minimum time the branded splash stays up. Fonts usually resolve in a few
 * milliseconds, so without a floor the launch artwork would never actually be
 * seen — the app would blink from the flat native fill straight into content.
 */
const SPLASH_MIN_DURATION_MS = 700;

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        'Inter-Regular': Inter_400Regular,
        'Inter-Medium': Inter_500Medium,
        'Inter-SemiBold': Inter_600SemiBold,
        'Inter-Bold': Inter_700Bold,
        'Inter-BlackItalic': Inter_900Black_Italic,
    });

    const [minDurationPassed, setMinDurationPassed] = useState(false);

    useEffect(() => {
        // Hand over from the native launch screen (a flat accent fill) to the
        // branded <AppSplash>: both share the background, so the swap is
        // invisible, and React controls the artwork exactly as designed.
        SplashScreen.hideAsync();

        const timer = setTimeout(() => setMinDurationPassed(true), SPLASH_MIN_DURATION_MS);
        return () => clearTimeout(timer);
    }, []);

    // Fonts still loading (or failed — system fonts then act as the fallback
    // rather than trapping the user on a blank screen).
    if ((!fontsLoaded && !fontError) || !minDurationPassed) {
        return <AppSplash />;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={styles.flex}>
                <SafeAreaProvider>
                    <StatusBar style="auto" />
                    <Slot />
                    <RNToast config={toastConfig} />
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </QueryClientProvider>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
});
