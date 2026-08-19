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
                {/* Post-registration profile setup — entered from the app index
                    while the questionnaire has not been completed. */}
                <Stack.Screen name="setup-intro" />
                <Stack.Screen name="setup-name" />
                <Stack.Screen name="setup-greeting" />
                <Stack.Screen name="setup-gender" />
                <Stack.Screen name="setup-birth-date" />
                <Stack.Screen name="setup-units" />
                <Stack.Screen name="setup-weight" />
                <Stack.Screen name="setup-height" />
                <Stack.Screen name="setup-benefit-macros" />
                <Stack.Screen name="setup-benefit-diet" />
                <Stack.Screen name="setup-benefit-plan" />
                <Stack.Screen name="setup-activity" />
                <Stack.Screen name="setup-goal" />
                <Stack.Screen name="setup-target-weight" />
                <Stack.Screen name="setup-calorie-goal" />
                <Stack.Screen name="setup-water-goal" />
                <Stack.Screen name="setup-steps-goal" />
                <Stack.Screen name="goal-setup" />
                <Stack.Screen name="recipe-search" />
                <Stack.Screen name="meal-details" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="add-product" />
                <Stack.Screen
                    name="product-amount"
                    options={{
                        // Шит вибору кількості (Порція | Штука | Грам).
                        presentation: 'formSheet',
                        sheetAllowedDetents: [0.5],
                        sheetCornerRadius: 24,
                        sheetGrabberVisible: false,
                    }}
                />
                <Stack.Screen
                    name="meal-portions"
                    options={{
                        // Той самий патерн, що й recipes-filter: bottom sheet
                        // виглядом, але повноцінний екран.
                        presentation: 'formSheet',
                        sheetAllowedDetents: [0.75],
                        sheetCornerRadius: 24,
                        sheetGrabberVisible: false,
                    }}
                />
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
