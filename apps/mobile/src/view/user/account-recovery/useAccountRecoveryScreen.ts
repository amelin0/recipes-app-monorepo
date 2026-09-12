import { useCallback, useEffect, useState } from 'react';

import { router } from 'expo-router';

import { AccountStorage } from '@/data/local/domains/user';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetCurrentUser, useSignOut } from '@/state/domains/auth';
import { useCancelAccountDeletion } from '@/state/domains/user';

const SECOND = 1000;
const pad = (value: number) => String(value).padStart(2, '0');

export const useAccountRecoveryScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);
    const cancelDeletion = useCancelAccountDeletion();
    const signOut = useSignOut();

    // Строк тримає сервер — `GET /auth/me` віддає його при кожному вході, тож
    // відлік однаковий на будь-якому пристрої. Копія на пристрої лишається
    // запасною: без мережі краще показати вчорашню цифру, ніж жодної.
    const { data: me } = useGetCurrentUser();
    const scheduledFor = me?.deletionScheduledFor ?? AccountStorage.getDeletionDeadline();
    const parsed = scheduledFor ? Date.parse(scheduledFor) : NaN;
    const deadline = Number.isNaN(parsed) ? null : parsed;

    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), SECOND);
        return () => clearInterval(timer);
    }, []);

    const left = deadline === null ? 0 : Math.max(deadline - now, 0);
    const days = Math.floor(left / (24 * 60 * 60 * SECOND));
    const hours = Math.floor(left / (60 * 60 * SECOND)) % 24;
    const minutes = Math.floor(left / (60 * SECOND)) % 60;
    const seconds = Math.floor(left / SECOND) % 60;

    const handleRestore = useCallback(() => {
        if (cancelDeletion.isPending) return;

        cancelDeletion.mutate(undefined, {
            onSuccess: () => router.replace('/(app)/account-restored'),
            onError: () => {
                ToastService.error(t('common:states.error'));
                router.replace('/(app)/account-restore-failed');
            },
        });
    }, [cancelDeletion, t]);

    return {
        /** Без строку відлік не малюємо — вигадана цифра гірша за її відсутність. */
        hasCountdown: deadline !== null,
        countdown: t('profile:account-recovery.countdown', {
            days,
            clock: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
            count: days,
        }),
        isRestoring: cancelDeletion.isPending,
        handleRestore,
        handleLogout: () => void signOut(),
    };
};
