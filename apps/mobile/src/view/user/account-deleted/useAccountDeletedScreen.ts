import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';

export const useAccountDeletedScreen = () => {
    const reset = useStore(state => state.reset);

    const handleRestore = useCallback(() => {
        // TODO: POST /me/restore once the API ships — mock success for now.
        router.replace('/(app)/account-restored');
    }, []);

    return { handleRestore, handleLogout: reset };
};
