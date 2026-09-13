import { Redirect, Tabs } from 'expo-router';

import { AppTabBar } from '@/shared/ui/widgets';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { useGetCurrentUser } from '@/state/domains/auth';
import { useGetShoppingList } from '@/state/domains/shopping-list';
import { useGetOnboarding } from '@/state/domains/user';

export default function TabsLayout() {
    const { t } = useAppTranslation();

    /**
     * Та сама перевірка, що й на кореневому екрані, але тут вона ловить інший
     * шлях: коли гард відкриває захищену групу після входу, роутер веде на
     * вкладки, а не через корінь, — і свіжий акаунт бачив порожню головну
     * замість анкети. Помилка мережі нікого не замикає: без відповіді вкладки
     * лишаються.
     */
    const { data: onboarding, isError: isOnboardingError } = useGetOnboarding();
    const { data: me, isError: isMeError } = useGetCurrentUser();

    // Лічильник рахує сервер — свій підрахунок тут розійшовся б зі списком,
    // який ховає куплене й підсумовує план на кожному читанні.
    const from = useStore(state => state.shoppingFrom);
    const to = useStore(state => state.shoppingTo);
    const shoppingCount = useGetShoppingList(from, to).data?.visibleCount ?? 0;

    if (!isMeError && me?.deletionScheduledFor) return <Redirect href="/(app)/account-recovery" />;
    if (!isOnboardingError && onboarding && !onboarding.completed) {
        return <Redirect href="/(app)/setup-intro" />;
    }

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
