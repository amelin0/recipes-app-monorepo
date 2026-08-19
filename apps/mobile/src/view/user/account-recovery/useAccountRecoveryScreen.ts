import { useCallback, useEffect, useState } from 'react';

import { router } from 'expo-router';

import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';

import { ACCOUNT_RECOVERY_DAYS } from '../user.constants';

const SECOND = 1000;
const pad = (value: number) => String(value).padStart(2, '0');

export const useAccountRecoveryScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);
    const reset = useStore(state => state.reset);

    // TODO: the deadline comes with the deletion request from the API. The mock
    // adds the design's own remainder so the clock reads like 804:25380.
    const [deadline] = useState(
        () => Date.now() + ACCOUNT_RECOVERY_DAYS * 24 * 60 * 60 * SECOND + ((14 * 60 + 32) * 60 + 7) * SECOND,
    );
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
        // TODO: POST /me/restore once the API ships — mock success for now; the
        // failure path is 804:25402.
        router.replace('/(app)/account-restored');
    }, []);

    return {
        countdown: t('profile:account-recovery.countdown', {
            days,
            clock: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
            count: days,
        }),
        handleRestore,
        handleLogout: reset,
    };
};
