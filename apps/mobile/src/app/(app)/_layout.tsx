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
                <Stack.Screen name="setup-summary" />
                <Stack.Screen name="setup-notifications" />
                <Stack.Screen name="setup-reminders" />
                {/* Closes the funnel: the pitch, then the receipt. Both are
                    flow endpoints — swiping back would offer to buy again or
                    re-show a purchase that already went through. */}
                <Stack.Screen name="paywall" options={{ gestureEnabled: false }} />
                <Stack.Screen name="subscription-success" options={{ gestureEnabled: false }} />
                <Stack.Screen name="goal-setup" />
                <Stack.Screen
                    name="activity-edit"
                    options={{
                        // The eight-row legend makes this sheet taller than the
                        // number ones, and by different amounts per device —
                        // so it sizes itself rather than taking a fraction
                        // (984:58596).
                        presentation: 'formSheet',
                        sheetAllowedDetents: 'fitToContents',
                        sheetCornerRadius: 24,
                        sheetGrabberVisible: false,
                    }}
                />
                <Stack.Screen name="metric-detail" />
                {/* Logging a reading: a sheet, then its receipt (673:41245,
                    673:43135). The receipt is a flow endpoint. */}
                <Stack.Screen
                    name="metric-add"
                    options={{
                        presentation: 'formSheet',
                        sheetAllowedDetents: [0.42],
                        sheetCornerRadius: 24,
                        sheetGrabberVisible: false,
                    }}
                />
                <Stack.Screen name="metric-updated" options={{ gestureEnabled: false }} />
                <Stack.Screen
                    name="weigh-in-reminder"
                    options={{
                        presentation: 'formSheet',
                        sheetAllowedDetents: [0.72],
                        sheetCornerRadius: 24,
                        sheetGrabberVisible: false,
                    }}
                />
                {/* Flow endpoint: the meal is already logged, so going back
                    into the portion picker would offer to log it again. */}
                <Stack.Screen name="meal-logged" options={{ gestureEnabled: false }} />
                <Stack.Screen name="recipe-search" />
                <Stack.Screen name="meal-details" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="profile-edit" />
                <Stack.Screen name="settings-reminders" />
                <Stack.Screen name="settings-language" />
                <Stack.Screen name="settings-theme" />
                <Stack.Screen name="settings-units" />
                <Stack.Screen name="faq" />
                <Stack.Screen name="feedback" />
                {/* Both are flow endpoints — going back would re-submit or
                    re-request something that already happened. */}
                <Stack.Screen name="feedback-sent" options={{ gestureEnabled: false }} />
                <Stack.Screen name="account-deleted" options={{ gestureEnabled: false }} />
                <Stack.Screen name="account-recovery" />
                <Stack.Screen name="account-delete" />
                <Stack.Screen name="account-delete-confirm" />
                <Stack.Screen name="referral" />
                <Stack.Screen name="account-restored" options={{ gestureEnabled: false }} />
                <Stack.Screen name="account-restore-failed" />
                <Stack.Screen name="notifications" />
                <Stack.Screen name="notification-detail" />
                <Stack.Screen name="problem" />
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
                        // Bottom sheet виглядом, але повноцінний екран.
                        presentation: 'formSheet',
                        // The dial sheet is nearly full height (811:58844).
                        sheetAllowedDetents: [0.86],
                        sheetCornerRadius: 24,
                        sheetGrabberVisible: false,
                    }}
                />
                <Stack.Screen name="add-dish" />
                <Stack.Screen name="create-dish" />
                <Stack.Screen name="dish-created" />
                <Stack.Screen name="recipes-filter" />
                <Stack.Screen
                    name="copy-plan"
                    options={{
                        // Шторка вибору днів копіювання (435:14472) — та сама
                        // ручна шторка, що й filter-ingredients.
                        presentation: 'transparentModal',
                        animation: 'slide_from_bottom',
                        contentStyle: { backgroundColor: 'transparent' },
                    }}
                />
                <Stack.Screen
                    name="filter-ingredients"
                    options={{
                        // Каталог інгредієнтів — шторка поверх фільтрів
                        // (626:22930). Звичайний formSheet тут малює контент
                        // зі зсувом (баг native-screens із ScrollView усередині),
                        // тому шторка зібрана вручну поверх прозорої модалки.
                        presentation: 'transparentModal',
                        animation: 'slide_from_bottom',
                        contentStyle: { backgroundColor: 'transparent' },
                    }}
                />
            </Stack.Protected>
        </Stack>
    );
}
