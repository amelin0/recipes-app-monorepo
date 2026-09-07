import { Logger } from '@nestjs/common';
import { Resend } from 'resend';

import { EmailClient, SendEmailParams } from './email.types';

type RequiredSendParams = Required<Pick<SendEmailParams, 'to' | 'subject' | 'html' | 'from'>>;

export class ResendEmailClient implements EmailClient {
    private readonly logger = new Logger(ResendEmailClient.name);
    private readonly resend: Resend;

    constructor(apiKey: string) {
        this.resend = new Resend(apiKey);
    }

    async send({ to, subject, html, from }: RequiredSendParams): Promise<void> {
        const { error } = await this.resend.emails.send({ from, to, subject, html });

        // Resend reports failures on the result object rather than throwing, so
        // an unchecked call looks successful while the message never left.
        if (error) {
            this.logger.error({ msg: 'Resend rejected the message', to, subject, err: error });
            throw new Error(`Resend failed to send to ${to}: ${error.message}`);
        }
    }
}
