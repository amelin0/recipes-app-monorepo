import { useCallback, useState } from 'react';

import { router } from 'expo-router';

import { useAppTranslation } from '@/shared/utils/translations';

export const useAccountDeleteConfirmScreen = () => {
    const { t } = useAppTranslation(['profile']);
    const [value, setValue] = useState('');

    const confirmWord = t('profile:delete-flow.confirm-word');
    const isConfirmed = value.trim().toUpperCase() === confirmWord;

    const handleDelete = useCallback(() => {
        if (!isConfirmed) return;
        // TODO: DELETE /me once the API ships — the receipt takes over.
        router.replace('/(app)/account-deleted');
    }, [isConfirmed]);

    return { value, setValue, confirmWord, isConfirmed, handleDelete };
};
