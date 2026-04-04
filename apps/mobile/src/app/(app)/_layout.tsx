import { Stack, usePathname } from 'expo-router';

export default function AppLayout() {
  const isLoggedIn = false;

  const pathname = usePathname();
  console.log('pathname', pathname);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />

      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(home)" />
        <Stack.Screen name="(maps)" />
      </Stack.Protected>
    </Stack>
  );
}
