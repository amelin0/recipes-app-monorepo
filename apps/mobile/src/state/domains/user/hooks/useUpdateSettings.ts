import { useMutation } from '@tanstack/react-query';

import { UserApi, type Profile, type UpdateSettingsPayload, type UserSettings } from '@/data';
import { queryClient, userKeys } from '@/shared/services';

/**
 * One switch per call — the API takes a partial body and answers with the
 * settings alone, so the result is merged into the cached profile rather than
 * written over it (`PATCH /profile` is the one that returns a whole profile).
 *
 * Optimistic: the radio rows are instant feedback, so the row moves on tap
 * and rolls back if the write fails.
 */
export const useUpdateSettings = () =>
    useMutation({
        mutationFn: (payload: UpdateSettingsPayload) => UserApi.updateSettings(payload),

        onMutate: async (payload: UpdateSettingsPayload) => {
            await queryClient.cancelQueries({ queryKey: userKeys.profile() });
            const previous = queryClient.getQueryData<Profile>(userKeys.profile());

            if (previous) {
                queryClient.setQueryData<Profile>(userKeys.profile(), {
                    ...previous,
                    settings: { ...previous.settings, ...payload },
                });
            }

            return { previous };
        },

        onError: (_error, _payload, context) => {
            if (context?.previous) {
                queryClient.setQueryData(userKeys.profile(), context.previous);
            }
        },

        onSuccess: (settings: UserSettings) => {
            queryClient.setQueryData<Profile>(userKeys.profile(), current =>
                current ? { ...current, settings } : current,
            );
        },
    });
