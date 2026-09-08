import { Injectable, NotFoundException } from '@nestjs/common';

import {
    AdminFeedbackDetail,
    AdminFeedbackListItem,
    AdminFeedbackNote,
    AdminFeedbackRepository,
} from '@dns/database';
import { FeedbackStatus } from '@dns/shared-types';
import { AdminFeedbackListQuery } from '@dns/validation';

import { SupportErrorCode } from './support.errors';

/**
 * The support queue.
 *
 * Nothing here reaches the person who raised the ticket: there is no mailer and
 * no notification service in this module, and that is the design rather than an
 * omission (support-inbox FR-011). Replies go out by email, outside the panel.
 */
@Injectable()
export class SupportService {
    constructor(private readonly feedbackRepository: AdminFeedbackRepository) {}

    list(query: AdminFeedbackListQuery): Promise<{ items: AdminFeedbackListItem[]; total: number }> {
        return this.feedbackRepository.list({
            filters: { status: query.status, type: query.type, search: query.search },
            page: query.page,
            limit: query.limit,
        });
    }

    async findById(id: string): Promise<AdminFeedbackDetail> {
        const ticket = await this.feedbackRepository.findById(id);
        if (!ticket) throw new NotFoundException({ message: 'Ticket not found', code: SupportErrorCode.NotFound });
        return ticket;
    }

    async setStatus(id: string, status: FeedbackStatus): Promise<void> {
        const updated = await this.feedbackRepository.setStatus(id, status);
        if (!updated) throw new NotFoundException({ message: 'Ticket not found', code: SupportErrorCode.NotFound });
    }

    /**
     * The author comes from the token, never from the request body — a journal
     * that lets the caller sign it is not evidence of anything.
     */
    async addNote(id: string, author: { id: string; fullName: string }, body: string): Promise<AdminFeedbackNote> {
        await this.findById(id);

        return this.feedbackRepository.addNote({
            feedbackId: id,
            authorId: author.id,
            authorName: author.fullName,
            body,
        });
    }
}
