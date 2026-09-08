/** The five options the form offers (feedback FR-002). */
export enum FeedbackType {
    Bug = 'bug',
    NotWorking = 'not_working',
    Improvement = 'improvement',
    FeatureRequest = 'feature_request',
    Other = 'other',
}

/** Where a ticket stands. Staff move it; the client only ever creates. */
export enum FeedbackStatus {
    New = 'new',
    InProgress = 'in_progress',
    Resolved = 'resolved',
    /**
     * Spam, a duplicate, or something we will not act on.
     *
     * Distinct from `Resolved` on purpose: a queue where the only way to clear
     * junk is to call it solved reports more solved tickets than were ever
     * solved (support-inbox, Edge Cases).
     */
    Rejected = 'rejected',
}
