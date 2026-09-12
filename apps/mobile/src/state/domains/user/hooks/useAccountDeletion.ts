import { useMutation } from '@tanstack/react-query';

import { UserApi, type AccountDeletionRequest } from '@/data';
import { AccountStorage } from '@/data/local/domains/user';
import { queryClient } from '@/shared/services';

/**
 * Schedules the erasure and remembers the deadline on this device.
 *
 * The API has no route that reads a pending request back, so a restart would
 * otherwise leave the recovery screen with no clock to show — see
 * `handoff/mobile-ui-review.md` §4.
 *
 * 409 `user.deletion-already-pending` means a request is already in flight;
 * the recovery screen is the right destination either way.
 */
export const useRequestAccountDeletion = () =>
    useMutation({
        mutationFn: () => UserApi.requestDeletion(),
        onSuccess: (request: AccountDeletionRequest) => {
            AccountStorage.saveDeletionDeadline(request.scheduledFor);
        },
    });

/** «Відновити обліковий запис» — 404 when nothing is pending. */
export const useCancelAccountDeletion = () =>
    useMutation({
        mutationFn: () => UserApi.cancelDeletion(),
        onSuccess: () => {
            AccountStorage.clearDeletionDeadline();
            // Every read was made against an account on its way out; drop the
            // lot rather than guess which of them the restore changed.
            queryClient.clear();
        },
    });
