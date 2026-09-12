import { useCallback, useEffect, useState } from 'react';

import { router } from 'expo-router';

import { AccountStorage } from '@/data/local/domains/user';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useSignOut } from '@/state/domains/auth';
import { useCancelAccountDeletion } from '@/state/domains/user';

import { ACCOUNT_RECOVERY_DAYS } from '../user.constants';

const SECOND = 1000;
const pad = (value: number) => String(value).padStart(2, '0');

export const useAccountRecoveryScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);
    const cancelDeletion = useCancelAccountDeletion();
    const signOut = useSignOut();

    // Дедлайн приходить у відповіді на запит видалення і лежить на пристрої:
    // ендпоінта, який читає незавершений запит, у API немає. Якщо його там
    // немає (вхід з іншого пристрою) — показуємо повне вікно, бо коротший
    // відлік злякав би сильніше, ніж є підстав.
    const [deadline] = useState(() => {
        const stored = AccountStorage.getDeletionDeadline();
        const parsed = stored ? Date.parse(stored) : NaN;
        return Number.isNaN(parsed) ? Date.now() + ACCOUNT_RECOVERY_DAYS * 24 * 60 * 60 * SECOND : parsed;
    });
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), SECOND);
        return () => clearInterval(timer);
    }, []);

    const left = Math.max(deadline - now, 0);
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
