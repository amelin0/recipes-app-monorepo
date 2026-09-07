export interface EmailConfig {
    /**
     * Resend API key. Absent is a supported state, not a misconfiguration:
     * the module then wires the stub client and messages go to the log.
     */
    apiKey?: string;
    /** Verified sender address, e.g. `noreply@rationfit.app`. */
    from: string;
}

export interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

/**
 * The seam every sender goes through. Two implementations ship:
 * `ResendEmailClient` and `StubEmailClient`.
 */
export interface EmailClient {
    send(params: Required<Pick<SendEmailParams, 'to' | 'subject' | 'html' | 'from'>>): Promise<void>;
}
