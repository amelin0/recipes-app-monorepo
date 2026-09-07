/**
 * Staff roles. Deliberately not part of the app's user model: an admin is a
 * separate account in a separate table
 * ([ADR-0003](../../../docs/adr/0003-auth-model-tokens-and-admin-permissions.md)).
 */
export enum AdminRole {
    /** Full access to content and users. The role every account gets by default. */
    Admin = 'admin',
    /** Additionally: creating, deactivating and re-roling other admins. */
    SuperAdmin = 'super_admin',
}

/** Whose session the panel is holding — the answer to `GET /auth/me`. */
export interface AdminProfile {
    id: string;
    email: string;
    fullName: string;
    role: AdminRole;
}

/** What a successful sign-in hands back. */
export interface AdminSession {
    accessToken: string;
    refreshToken: string;
    admin: AdminProfile;
}
