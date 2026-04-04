import { Tabs } from 'expo-router';

import { TabBar } from '@/shared/ui/components/navigation';

export default function HomeLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="health" />
      <Tabs.Screen name="diary" />
      <Tabs.Screen name="statistics" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
