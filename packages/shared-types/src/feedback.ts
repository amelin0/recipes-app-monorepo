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
}
