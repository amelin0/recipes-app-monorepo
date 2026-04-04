import { useEffect } from 'react';

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      {/* terms-and-conditions  */}
      <Stack.Screen name="enter-name" />
      <Stack.Screen name="enter-birthday" />
      <Stack.Screen name="set-password" />
    </Stack>
  );
}
