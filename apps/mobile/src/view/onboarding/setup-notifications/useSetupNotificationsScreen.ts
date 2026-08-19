import { useCallback } from 'react';

import { router } from 'expo-router';

export const useSetupNotificationsScreen = () => {
    const goNext = useCallback(() => {
        router.push('/(app)/setup-reminders');
    }, []);

    const handleAllow = useCallback(() => {
        // TODO: request the OS permission before moving on. Priming first is
        // deliberate — iOS only ever shows its own prompt once.
        goNext();
    }, [goNext]);

    return { handleSkip: goNext, handleAllow };
};
