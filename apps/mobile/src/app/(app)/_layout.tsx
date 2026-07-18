import { Stack } from 'expo-router';

import { useStore } from '@/state';

export default function AppLayout() {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!isAuthenticated}>
                <Stack.Screen name="(auth)" />
            </Stack.Protected>

            <Stack.Protected guard={isAuthenticated}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="goal-setup" />
                <Stack.Screen name="recipe-search" />
                <Stack.Screen
                    name="recipes-filter"
                    options={{
                        // Виглядає як bottom sheet, але це повноцінний екран
                        // (вимога дизайну): iOS formSheet з детентом.
                        presentation: 'formSheet',
                        sheetAllowedDetents: [0.92],
                        sheetCornerRadius: 24,
                        sheetGrabberVisible: false,
                    }}
                />
            </Stack.Protected>
        </Stack>
    );
}
