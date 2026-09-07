import { registerAs } from '@nestjs/config';

import { EmailConfig } from './config.type';

export default registerAs<EmailConfig>('email', () => ({
    // Empty is a supported state: EmailModule then wires the stub client and
    // messages are logged instead of sent.
    apiKey: process.env.RESEND_API_KEY || undefined,
    from: process.env.EMAIL_FROM ?? 'noreply@rationfit.app',
}));
