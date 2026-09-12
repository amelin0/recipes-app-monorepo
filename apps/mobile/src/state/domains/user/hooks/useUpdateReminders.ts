import { useMutation } from '@tanstack/react-query';

import { UserApi, type Reminder, type UpdateRemindersPayload } from '@/data';
import { queryClient, userKeys } from '@/shared/services';

/**
 * «Зберегти зміни» sends the whole set, and the response is the whole set —
 * so the cache takes the answer rather than refetching it.
 */
export const useUpdateReminders = () =>
    useMutation({
        mutationFn: (payload: UpdateRemindersPayload) => UserApi.updateReminders(payload),
        onSuccess: (reminders: Reminder[]) => {
            queryClient.setQueryData(userKeys.reminders(), reminders);
        },
    });
