import { Redirect } from 'expo-router';

import { AppStorage } from '@/data/local/domains/app';
import { useStore } from '@/state';

export default function Index() {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    if (isAuthenticated) {
        return <Redirect href="/(app)/(tabs)/home" />;
    }

    // Read synchronously from MMKV: the native splash is still up, so there is
    // no frame where the wrong destination could flash.
    if (!AppStorage.getOnboardingCompleted()) {
        return <Redirect href="/(app)/(auth)/onboarding" />;
    }

    return <Redirect href="/(app)/(auth)/sign-in" />;
}
