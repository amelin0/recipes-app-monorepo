import { deleteLocalData, readLocalData, writeLocalData } from '@/shared/services';

/**
 * A device-side copy of the deletion deadline. The source is the server —
 * `GET /auth/me` returns `deletionScheduledFor` on every launch — and this
 * copy exists only so the countdown survives a launch without network.
 * Losing it costs nothing but the countdown: the schedule is the server's.
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
