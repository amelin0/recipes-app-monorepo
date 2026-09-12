import { Tabs } from 'expo-router';

import { AppTabBar } from '@/shared/ui/widgets';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { useGetShoppingList } from '@/state/domains/shopping-list';

export default function TabsLayout() {
    const { t } = useAppTranslation();

    // Лічильник рахує сервер — свій підрахунок тут розійшовся б зі списком,
    // який ховає куплене й підсумовує план на кожному читанні.
    const from = useStore(state => state.shoppingFrom);
    const to = useStore(state => state.shoppingTo);
    const shoppingCount = useGetShoppingList(from, to).data?.visibleCount ?? 0;

    return (
        <Tabs screenOptions={{ headerShown: false }} tabBar={props => <AppTabBar {...props} />}>
            <Tabs.Screen name="home" options={{ title: t('common:tabs.home') }} />
            <Tabs.Screen name="recipes" options={{ title: t('common:tabs.recipes') }} />
            <Tabs.Screen name="meal-plan" options={{ title: t('common:tabs.meal-plan') }} />
            <Tabs.Screen name="progress" options={{ title: t('common:tabs.progress') }} />
            <Tabs.Screen
                name="shopping-list"
                options={{
                    title: t('common:tabs.shopping-list'),
                    tabBarBadge: shoppingCount > 0 ? shoppingCount : undefined,
                }}
            />
        </Tabs>
    );
}
