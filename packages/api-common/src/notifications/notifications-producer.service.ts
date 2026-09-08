import { Injectable, Logger } from '@nestjs/common';

import { DEFAULT_LANGUAGE, NotificationTemplateInput, notificationTemplate } from '@dns/constants';
import { NotificationRepository, UserSettingsRepository } from '@dns/database';
import { NotificationEvent } from '@dns/shared-types';

/**
 * Writes the messages the app's inbox shows.
 *
 * One service for both APIs, because both produce: the client one when a
 * subscription, a referral or a deletion request happens, the admin one when a
 * user's product is verified. Two copies would drift on the day one of them
 * learned a new field.
 *
 * **A notification is a side effect, never a reason to fail.** Every method
 * swallows its own errors: a purchase that succeeded must not report failure
 * because the message about it could not be written. What is lost is a line in
 * an inbox; what would be lost otherwise is somebody's money.
 */
@Injectable()
export class NotificationsProducer {
    private readonly logger = new Logger(NotificationsProducer.name);

    constructor(
        private readonly notifications: NotificationRepository,
        private readonly settings: UserSettingsRepository,
    ) {}

    /**
     * Writes one message for one account, in the language that account reads
     * in **at this moment**.
     *
     * The language is resolved once, here, and the text is then stored: a
     * notification is a record of what was said, so changing the app's
     * language later must not rewrite yesterday's messages (schema comment).
     */
    async emit(userId: string, event: NotificationEvent, input: EmitInput = {}): Promise<void> {
        try {
            const language = await this.languageOf(userId);
            const template = notificationTemplate(event, language, {
                subject: input.date ? this.formatDate(input.date, language) : input.subject,
            });

            if (!template) {
                // A declared-but-not-produced event reached a caller. Worth
                // seeing in the logs: it is a bug, not a quiet no-op.
                this.logger.warn({ msg: 'no notification template', event, language });
                return;
            }

            await this.notifications.create({
                userId,
                event,
                type: template.type,
                title: template.title,
                body: template.body,
                subtitle: template.subtitle ?? null,
                actionLabel: template.actionLabel ?? null,
                actionRoute: template.actionRoute ?? null,
            });
        } catch (error) {
            this.logger.error({ msg: 'failed to write a notification', event, userId, error });
        }
    }

    private async languageOf(userId: string): Promise<string> {
        const settings = await this.settings.findByUserId(userId);
        return settings?.language ?? DEFAULT_LANGUAGE;
    }

    /**
     * Dates are formatted here rather than by each caller, so «12 жовтня» and
     * «12 October» come out of one place — and so a caller cannot accidentally
     * put an ISO string in front of a reader.
     *
     * No time of day: the day is the part that means something in every one of
     * these messages, and an hour would be in the server's zone, not theirs.
     */
    private formatDate(date: Date, language: string): string {
        return new Intl.DateTimeFormat(language === 'uk' ? 'uk-UA' : 'en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
        }).format(date);
    }
}

export interface EmitInput extends NotificationTemplateInput {
    /** Formatted for the reader's language; use this instead of `subject` for dates. */
    date?: Date;
}
