/**
 * What an uploaded file is for. Becomes a path segment in the object key, so
 * a grant issued for one purpose cannot be spent on another: a photo meant for
 * a support ticket can never end up as somebody's avatar.
 */
export enum StorageScope {
    ProfilePhoto = 'profile-photo',
    Feedback = 'feedback',
    RecipePhoto = 'recipe-photo',
}

/** What the client needs to put the bytes somewhere and then tell us where. */
export interface UploadGrant {
    /** Presigned PUT target. Short-lived. */
    uploadUrl: string;
    /** Where the file will be readable once uploaded — this is what comes back to the API. */
    publicUrl: string;
    key: string;
    expiresAt: string;
    /** Headers the PUT must carry, or the signature will not match. */
    headers: Record<string, string>;
}
