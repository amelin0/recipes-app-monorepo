import { Tabs } from 'expo-router';

import { AppTabBar } from '@/shared/ui/widgets';

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false }} tabBar={props => <AppTabBar {...props} />}>
            <Tabs.Screen name="home" options={{ title: 'Головна' }} />
            <Tabs.Screen name="meal-plan" options={{ title: 'План' }} />
            <Tabs.Screen name="tracking" options={{ title: 'Трекінг' }} />
            <Tabs.Screen name="recipes" options={{ title: 'Рецепти' }} />
            <Tabs.Screen name="profile" options={{ title: 'Профіль' }} />
        </Tabs>
    );
}
