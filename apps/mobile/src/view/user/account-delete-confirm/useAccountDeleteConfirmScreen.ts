import { useCallback, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useRequestAccountDeletion } from '@/state/domains/user';

export const useAccountDeleteConfirmScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);
    const requestDeletion = useRequestAccountDeletion();
    const [value, setValue] = useState('');

    const confirmWord = t('profile:delete-flow.confirm-word');
    const isConfirmed = value.trim().toUpperCase() === confirmWord;

    const handleDelete = useCallback(() => {
        if (!isConfirmed || requestDeletion.isPending) return;

        requestDeletion.mutate(undefined, {
            onSuccess: () => router.replace('/(app)/account-deleted'),
            onError: (error: unknown) => {
                // 409 — запит уже стоїть у черзі. Для користувача це те саме
                // «видалення заплановано», тож ведемо на ту саму квитанцію.
                if ((error as { statusCode?: number } | undefined)?.statusCode === 409) {
                    router.replace('/(app)/account-deleted');
                    return;
                }
                ToastService.error(t('common:states.error'));
            },
        });
    }, [isConfirmed, requestDeletion, t]);

    return { value, setValue, confirmWord, isConfirmed, isDeleting: requestDeletion.isPending, handleDelete };
};
