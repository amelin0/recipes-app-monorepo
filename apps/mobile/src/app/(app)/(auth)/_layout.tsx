import { Stack } from 'expo-router';

/**
 * Sign-in is the entry point of the funnel. Onboarding is reached only by an
 * explicit redirect from the app entry on first launch — without pinning this,
 * the first declared screen wins and an expiring session (the HTTP layer flips
 * the auth guard on an unrecoverable 401) would drop a long-standing user onto
 * the intro carousel instead of the sign-in form.
 */
export const unstable_settings = { initialRouteName: 'sign-in' };

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="sign-up" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="email-verify" />
            <Stack.Screen name="set-new-password" />
            <Stack.Screen
                name="password-changed"
                // Flow endpoint: the reset is already applied, so swiping back
                // into the password form would show a stale, meaningless state.
                options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="onboarding" />
        </Stack>
    );
}
