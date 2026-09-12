import { deleteLocalData, readLocalData, writeLocalData } from '@/shared/services';

/**
 * The deletion deadline, kept on the device because the API exposes no route
 * that reads a pending request back (`handoff/mobile-ui-review.md` §4).
 * Losing it only costs the countdown, never the deletion — the server holds
 * the schedule either way.
 */
export class AccountStorage {
    /** ISO instant from `POST /profile/deletion-request`. */
    static saveDeletionDeadline(scheduledFor: string) {
        writeLocalData('accountDeletionDeadline', { scheduledFor });
    }

    static getDeletionDeadline(): string | null {
        return readLocalData<{ scheduledFor: string }>('accountDeletionDeadline')?.scheduledFor ?? null;
    }

    static clearDeletionDeadline() {
        deleteLocalData('accountDeletionDeadline');
    }
}
