import { Redirect } from 'expo-router';

import { AppStorage } from '@/data/local/domains/app';
import { AppSplash } from '@/shared/ui/widgets';
import { useStore } from '@/state';
import { useGetOnboarding } from '@/state/domains/user';

export default function Index() {
    const isAuthenticated = useStore(state => state.isAuthenticated);
    const { data: onboarding, isLoading, isError } = useGetOnboarding();

    if (isAuthenticated) {
        // Чекаємо на відповідь: відправити в застосунок і за мить смикнути в
        // анкету — гірше, ніж зайва секунда сплеша.
        if (isLoading) return <AppSplash />;

        // Анкета закриває доступ до застосунку, але помилка мережі — ні:
        // інакше один невдалий запит замикав би вже налаштований акаунт
        // на екрані, де нема що заповнювати.
        if (!isError && onboarding && !onboarding.completed) {
            return <Redirect href="/(app)/setup-intro" />;
        }

        return <Redirect href="/(app)/(tabs)/home" />;
    }

    // Read synchronously from MMKV: the native splash is still up, so there is
    // no frame where the wrong destination could flash.
    if (!AppStorage.getOnboardingCompleted()) {
        return <Redirect href="/(app)/(auth)/onboarding" />;
    }

    return <Redirect href="/(app)/(auth)/sign-in" />;
}
