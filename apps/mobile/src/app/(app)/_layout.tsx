import { Stack } from 'expo-router';

import { useStore } from '@/state/store';

export default function AppLayout() {
  const isLoggedIn = useStore((s) => s.isAuthenticated);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(home)" />
      </Stack.Protected>

      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
