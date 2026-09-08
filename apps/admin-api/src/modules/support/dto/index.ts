import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import type { AdminFeedbackDetail, AdminFeedbackListItem, AdminFeedbackNote } from '@dns/database';
import { FeedbackStatus, FeedbackType } from '@dns/shared-types';
import {
    adminCreateFeedbackNoteSchema,
    adminFeedbackListQuerySchema,
    adminSetFeedbackStatusSchema,
} from '@dns/validation';

export class FeedbackListQueryDto extends createZodDto(adminFeedbackListQuerySchema) {}
export class SetFeedbackStatusInboundDto extends createZodDto(adminSetFeedbackStatusSchema) {}
export class CreateFeedbackNoteInboundDto extends createZodDto(adminCreateFeedbackNoteSchema) {}

class FeedbackAuthorView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;
    @ApiProperty() readonly email: string;
    @ApiProperty() readonly isBlocked: boolean;

    constructor(author: NonNullable<AdminFeedbackListItem['author']>) {
        this.id = author.id;
        this.email = author.email;
        this.isBlocked = author.isBlocked;
    }
}

/** One row of the support queue. */
export class FeedbackView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;
    @ApiProperty({ enum: FeedbackType }) readonly type: FeedbackType;
    @ApiProperty({ enum: FeedbackStatus }) readonly status: FeedbackStatus;
    @ApiProperty() readonly description: string;

    @ApiProperty({ description: 'How many screenshots came with it.' })
    readonly imageCount: number;

    @ApiProperty({ nullable: true }) readonly replyEmail: string | null;

    @ApiProperty({
        type: FeedbackAuthorView,
        nullable: true,
        description: 'Null once the author deletes their account — the ticket survives (ADR-0005).',
    })
    readonly author: FeedbackAuthorView | null;

    @ApiProperty() readonly createdAt: string;

    protected constructor(row: AdminFeedbackListItem) {
        this.id = row.id;
        this.type = row.type;
        this.status = row.status;
        this.description = row.description;
        this.imageCount = row.imageCount;
        this.replyEmail = row.replyEmail;
        this.author = row.author ? new FeedbackAuthorView(row.author) : null;
        this.createdAt = row.createdAt.toISOString();
    }

    static from(row: AdminFeedbackListItem): FeedbackView {
        return new FeedbackView(row);
    }
}

export class FeedbackNoteView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;

    @ApiProperty({ description: 'Who wrote it, as of when they wrote it.' })
    readonly authorName: string;

    @ApiProperty() readonly body: string;
    @ApiProperty() readonly createdAt: string;

    constructor(note: AdminFeedbackNote) {
        this.id = note.id;
        this.authorName = note.authorName;
        this.body = note.body;
        this.createdAt = note.createdAt.toISOString();
    }
}

export class FeedbackDetailView extends FeedbackView {
    @ApiProperty({ isArray: true, type: String })
    readonly imageUrls: string[];

    @ApiProperty({ description: 'Whatever the app attached: version, platform, OS.', nullable: true })
    readonly context: unknown;

    @ApiProperty({ type: FeedbackNoteView, isArray: true, description: 'Internal; never shown to the reporter.' })
    readonly notes: FeedbackNoteView[];

    private constructor(ticket: AdminFeedbackDetail) {
        super(ticket);
        this.imageUrls = ticket.imageUrls;
        this.context = ticket.context ?? null;
        this.notes = ticket.notes.map(note => new FeedbackNoteView(note));
    }

    static fromDetail(ticket: AdminFeedbackDetail): FeedbackDetailView {
        return new FeedbackDetailView(ticket);
    }
}
