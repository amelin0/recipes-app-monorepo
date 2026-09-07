export interface OtpConfig {
    /**
     * Fixed code for local development. When set, `generateCode()` always
     * returns it, so the whole sign-up flow is walkable without a mail
     * provider. Never set in production.
     */
    devCode?: string;
}
