import { Injectable } from '@nestjs/common';

import { EmailService } from '@dns/api-infrastructure/email';
import { AUTH_POLICY } from '@dns/constants';

/**
 * Copy for the two code emails. Ukrainian only — the app ships one locale, and
 * `users` carries no language column yet; when it does, this is the single
 * place that has to learn about it.
 */
@Injectable()
export class OtpMailer {
    constructor(private readonly emailService: EmailService) {}

    sendEmailVerificationCode(to: string, code: string): Promise<void> {
        return this.emailService.send({
            to,
            subject: 'RationFit — код підтвердження',
            html: this.codeTemplate('Ваш код підтвердження email', code),
        });
    }

    sendPasswordResetCode(to: string, code: string): Promise<void> {
        return this.emailService.send({
            to,
            subject: 'RationFit — відновлення паролю',
            html: this.codeTemplate('Ваш код для зміни паролю', code),
        });
    }

    private codeTemplate(heading: string, code: string): string {
        return [
            `<p>${heading}:</p>`,
            `<p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>`,
            `<p>Код дійсний ${AUTH_POLICY.otp.ttlMinutes} хвилин.</p>`,
            '<p>Якщо ви не надсилали цей запит — просто проігноруйте лист.</p>',
        ].join('');
    }
}
