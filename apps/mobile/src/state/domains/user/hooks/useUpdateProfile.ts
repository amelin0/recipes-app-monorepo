import { useMutation } from '@tanstack/react-query';

import { UserApi, type Profile, type UpdateProfilePayload } from '@/data';
import { queryClient, userKeys } from '@/shared/services';

/**
 * Name, photo and target weight. The response is the whole profile, so we
 * seed the cache with it rather than invalidating — the edit screen pops back
 * to the profile immediately and a refetch would show the old name first.
 */
export const useUpdateProfile = () =>
    useMutation({
        mutationFn: (payload: UpdateProfilePayload) => UserApi.updateProfile(payload),
        onSuccess: (profile: Profile) => {
            queryClient.setQueryData(userKeys.profile(), profile);
        },
    });
