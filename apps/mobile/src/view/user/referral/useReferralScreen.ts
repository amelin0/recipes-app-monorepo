import { useCallback } from 'react';

import { AppShare, copyToClipboard } from '@/shared/utils';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetReferral } from '@/state/domains/subscription';

export const useReferralScreen = () => {
    const { t } = useAppTranslation(['profile']);
    const { data, isLoading, isError, refetch } = useGetReferral();

    const code = data?.code ?? '';

    const handleCopy = useCallback(() => {
        if (!code) return;
        void copyToClipboard(code, t('profile:referral-screen.copied'));
    }, [code, t]);

    const handleShare = useCallback(() => {
        if (!code) return;
        void AppShare.text(t('profile:referral-screen.share-message', { code }));
    }, [code, t]);

    return {
        code,
        // «Приєдналось» рахує тих, хто ввів код; «Зароблено» — місяці, які вже
        // нарахували. Це різні числа: конвертація ще не означає нарахування.
        joined: data?.invited ?? 0,
        earned: data?.monthsEarned ?? 0,
        isLoading,
        isError,
        handleRetry: refetch,
        handleCopy,
        handleShare,
    };
};
