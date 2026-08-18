import { useCallback } from 'react';

import { router } from 'expo-router';

export const usePasswordChangedScreen = () => {
    const handleSignIn = useCallback(() => {
        // Pop the whole reset flow (forgot-password → email-verify →
        // set-new-password → here) so "back" from sign-in cannot re-enter it.
        if (router.canGoBack()) {
            router.dismissTo('/(app)/(auth)/sign-in');
        } else {
            router.replace('/(app)/(auth)/sign-in');
        }
    }, []);

    return { handleSignIn };
};
