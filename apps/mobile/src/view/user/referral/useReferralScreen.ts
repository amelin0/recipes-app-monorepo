import { useCallback } from 'react';

import { AppShare, copyToClipboard } from '@/shared/utils';
import { useAppTranslation } from '@/shared/utils/translations';

import { MOCK_REFERRAL } from '../user.constants';

export const useReferralScreen = () => {
    const { t } = useAppTranslation(['profile']);

    const handleCopy = useCallback(() => {
        void copyToClipboard(MOCK_REFERRAL.code, t('profile:referral-screen.copied'));
    }, [t]);

    const handleShare = useCallback(() => {
        void AppShare.text(t('profile:referral-screen.share-message', { code: MOCK_REFERRAL.code }));
    }, [t]);

    return {
        code: MOCK_REFERRAL.code,
        joined: MOCK_REFERRAL.joined,
        earned: MOCK_REFERRAL.earnedMonths,
        handleCopy,
        handleShare,
    };
};
