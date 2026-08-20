import { useCallback } from 'react';

import { router } from 'expo-router';

export const useAccountDeleteScreen = () => {
    const handleContinue = useCallback(() => {
        router.push('/(app)/account-delete-confirm');
    }, []);

    const handleCancel = useCallback(() => {
        if (router.canGoBack()) router.back();
    }, []);

    return { handleContinue, handleCancel };
};
