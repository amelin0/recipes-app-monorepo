import { Redirect } from 'expo-router';

import { useStore } from '@/state';

export default function Index() {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    if (isAuthenticated) {
        return <Redirect href="/(app)/(tabs)/home" />;
    }

    return <Redirect href="/(app)/(auth)/welcome" />;
}
