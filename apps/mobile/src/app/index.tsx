import { useEffect } from 'react';

import { Redirect } from 'expo-router';

import { AppStorage } from '@/data/local/domains/app';
import { AccountStorage } from '@/data/local/domains/user';
import { AppSplash } from '@/shared/ui/widgets';
import { useStore } from '@/state';
import { useGetCurrentUser } from '@/state/domains/auth';
import { useGetOnboarding } from '@/state/domains/user';

export default function Index() {
    const isAuthenticated = useStore(state => state.isAuthenticated);
    const { data: onboarding, isLoading, isError } = useGetOnboarding();
    // Стан акаунту потрібен саме тут: і холодний старт, і свіжий вхід
    // проходять через цей екран, і лише він вирішує, куди пустити далі.
    const { data: me, isLoading: isMeLoading, isError: isMeError } = useGetCurrentUser();

    // Дедлайн дублюємо на пристрій, щоб відлік лишався правдивим і без мережі,
    // і прибираємо, коли запиту вже немає.
    useEffect(() => {
        if (!me) return;
        if (me.deletionScheduledFor) AccountStorage.saveDeletionDeadline(me.deletionScheduledFor);
        else AccountStorage.clearDeletionDeadline();
    }, [me]);

    if (isAuthenticated) {
        // Чекаємо на відповідь: відправити в застосунок і за мить смикнути в
        // анкету — гірше, ніж зайва секунда сплеша.
        if (isLoading || isMeLoading) return <AppSplash />;

        // Запит на видалення старший за анкету: поки він чинний, застосунку
        // немає що показувати, крім можливості його скасувати.
        if (!isMeError && me?.deletionScheduledFor) {
            return <Redirect href="/(app)/account-recovery" />;
        }

        // Анкета закриває доступ до застосунку, але помилка мережі — ні:
        // інакше один невдалий запит замикав би вже налаштований акаунт
        // на екрані, де нема що заповнювати.
        if (!isError && onboarding && !onboarding.completed) {
            return <Redirect href="/(app)/setup-intro" />;
        }

        return <Redirect href="/(app)/(tabs)/home" />;
    }

    // Read synchronously from MMKV: the native splash is still up, so there is
    // no frame where the wrong destination could flash.
    if (!AppStorage.getOnboardingCompleted()) {
        return <Redirect href="/(app)/(auth)/onboarding" />;
    }

    return <Redirect href="/(app)/(auth)/sign-in" />;
}
