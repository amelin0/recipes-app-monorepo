import { Inject, Injectable } from '@nestjs/common';

import { EMAIL_CLIENT, EMAIL_CONFIG } from './email.tokens';
import { EmailClient, EmailConfig, SendEmailParams } from './email.types';

@Injectable()
export class EmailService {
    constructor(
        @Inject(EMAIL_CLIENT) private readonly client: EmailClient,
        @Inject(EMAIL_CONFIG) private readonly cfg: EmailConfig,
    ) {}

    async send(params: SendEmailParams): Promise<void> {
        await this.client.send({
            to: params.to,
            subject: params.subject,
            html: params.html,
            from: params.from ?? this.cfg.from,
        });
    }
}
