import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';

import { queryClient } from '../shared/services';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [bootReady, setBootReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;

    const timer = setTimeout(() => {
      setBootReady(true);
      SplashScreen.hideAsync();
    }, 500);

    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

  if (!bootReady || !fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardProvider>
        <GestureHandlerRootView style={styles.flex}>
          <SafeAreaProvider>
            <StatusBar style="auto" />
            <Slot />
            <Toaster />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </KeyboardProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
