import { Tabs } from 'expo-router';

import { AppTabBar } from '@/shared/ui/widgets';
import { useAppTranslation } from '@/shared/utils/translations';

export default function TabsLayout() {
    const { t } = useAppTranslation();

    return (
        <Tabs screenOptions={{ headerShown: false }} tabBar={props => <AppTabBar {...props} />}>
            <Tabs.Screen name="home" options={{ title: t('common:tabs.home') }} />
            <Tabs.Screen name="meal-plan" options={{ title: t('common:tabs.meal-plan') }} />
            <Tabs.Screen name="tracking" options={{ title: t('common:tabs.tracking') }} />
            <Tabs.Screen name="recipes" options={{ title: t('common:tabs.recipes') }} />
            <Tabs.Screen name="profile" options={{ title: t('common:tabs.profile') }} />
        </Tabs>
    );
}
