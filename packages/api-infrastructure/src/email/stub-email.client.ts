import { Logger } from '@nestjs/common';

import { EmailClient, SendEmailParams } from './email.types';

type RequiredSendParams = Required<Pick<SendEmailParams, 'to' | 'subject' | 'html' | 'from'>>;

/**
 * Used when no Resend key is configured — the whole auth flow stays walkable
 * locally without a mail provider. The body is logged in full so a
 * verification code can be read straight from the dev server output.
 */
export class StubEmailClient implements EmailClient {
    private readonly logger = new Logger(StubEmailClient.name);

    async send({ to, subject, html }: RequiredSendParams): Promise<void> {
        this.logger.log({ msg: '[stub email] not sent — no RESEND_API_KEY', to, subject, html });
    }
}
