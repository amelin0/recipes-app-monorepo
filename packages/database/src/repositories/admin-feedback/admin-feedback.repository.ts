import { Injectable } from '@nestjs/common';
import { SQL, and, asc, desc, eq, ilike, isNotNull, or, sql } from 'drizzle-orm';

import { FeedbackStatus, FeedbackType } from '@dns/shared-types';

import { feedback, feedbackNotes, users } from '../../schema';
import { BaseRepository } from '../base.repository';

export interface AdminFeedbackFilters {
    status?: FeedbackStatus;
    type?: FeedbackType;
    /** Matched against the ticket text and the reply address — never the notes. */
    search?: string;
}

export interface FeedbackAuthor {
    id: string;
    email: string;
    isBlocked: boolean;
}

export interface AdminFeedbackListItem {
    id: string;
    type: FeedbackType;
    status: FeedbackStatus;
    description: string;
    imageCount: number;
    replyEmail: string | null;
    /** Null once the author deletes their account — the ticket survives (ADR-0005). */
    author: FeedbackAuthor | null;
    createdAt: Date;
}

export interface AdminFeedbackNote {
    id: string;
    authorName: string;
    body: string;
    createdAt: Date;
}

export interface AdminFeedbackDetail extends AdminFeedbackListItem {
    imageUrls: string[];
    /** Whatever the app attached: version, platform, OS. */
    context: unknown;
    notes: AdminFeedbackNote[];
}

@Injectable()
export class AdminFeedbackRepository extends BaseRepository {
    async list(params: {
        filters: AdminFeedbackFilters;
        page: number;
        limit: number;
    }): Promise<{ items: AdminFeedbackListItem[]; total: number }> {
        const where = and(...this.conditions(params.filters));

        const [items, total] = await Promise.all([
            this.fetchList(where, { limit: params.limit, offset: (params.page - 1) * params.limit }),
            this.count(where),
        ]);

        return { items, total };
    }

    async findById(id: string): Promise<AdminFeedbackDetail | null> {
        const [row] = await this.db
            .select(this.projection())
            .from(feedback)
            .leftJoin(users, eq(users.id, feedback.userId))
            .where(eq(feedback.id, id))
            .limit(1);

        if (!row) return null;

        const notes = await this.db
            .select({
                id: feedbackNotes.id,
                authorName: feedbackNotes.authorName,
                body: feedbackNotes.body,
                createdAt: feedbackNotes.createdAt,
            })
            .from(feedbackNotes)
            .where(eq(feedbackNotes.feedbackId, id))
            .orderBy(asc(feedbackNotes.createdAt));

        return {
            ...this.toListItem(row),
            imageUrls: row.imageUrls,
            context: row.context,
            notes,
        };
    }

    async setStatus(id: string, status: FeedbackStatus): Promise<boolean> {
        const updated = await this.db
            .update(feedback)
            .set({ status, updatedAt: new Date() })
            .where(eq(feedback.id, id))
            .returning({ id: feedback.id });

        return updated.length > 0;
    }

    /**
     * Appends a note. There is no update and no delete, deliberately: a journal
     * that can be rewritten stops being evidence of what was known when.
     *
     * `authorName` is stored rather than joined — see the schema comment.
     */
    async addNote(input: {
        feedbackId: string;
        authorId: string;
        authorName: string;
        body: string;
    }): Promise<AdminFeedbackNote> {
        const [row] = await this.db
            .insert(feedbackNotes)
            .values(input)
            .returning({
                id: feedbackNotes.id,
                authorName: feedbackNotes.authorName,
                body: feedbackNotes.body,
                createdAt: feedbackNotes.createdAt,
            });

        if (!row) throw new Error('Failed to insert feedback note');

        return row;
    }

    private async fetchList(
        where: SQL | undefined,
        page: { limit: number; offset: number },
    ): Promise<AdminFeedbackListItem[]> {
        const rows = await this.db
            .select(this.projection())
            .from(feedback)
            .leftJoin(users, eq(users.id, feedback.userId))
            .where(where)
            // Newest first: a support queue is read from the top, and the
            // oldest end is the part that is already handled.
            .orderBy(desc(feedback.createdAt))
            .limit(page.limit)
            .offset(page.offset);

        return rows.map(row => this.toListItem(row));
    }

    private async count(where: SQL | undefined): Promise<number> {
        const [row] = await this.db
            .select({ total: sql<number>`count(*)::int` })
            .from(feedback)
            .leftJoin(users, eq(users.id, feedback.userId))
            .where(where);

        return row?.total ?? 0;
    }

    private projection() {
        return {
            id: feedback.id,
            type: feedback.type,
            status: feedback.status,
            description: feedback.description,
            imageUrls: feedback.imageUrls,
            replyEmail: feedback.replyEmail,
            context: feedback.context,
            createdAt: feedback.createdAt,
            authorId: users.id,
            authorEmail: users.email,
            authorBlockedAt: users.blockedAt,
        };
    }

    private toListItem(row: RawRow): AdminFeedbackListItem {
        return {
            id: row.id,
            type: row.type as FeedbackType,
            status: row.status as FeedbackStatus,
            description: row.description,
            imageCount: row.imageUrls.length,
            replyEmail: row.replyEmail,
            author:
                row.authorId && row.authorEmail
                    ? { id: row.authorId, email: row.authorEmail, isBlocked: row.authorBlockedAt !== null }
                    : null,
            createdAt: row.createdAt,
        };
    }

    private conditions(filters: AdminFeedbackFilters): SQL[] {
        const conditions: SQL[] = [];

        if (filters.status) conditions.push(eq(feedback.status, filters.status));
        if (filters.type) conditions.push(eq(feedback.type, filters.type));

        if (filters.search) {
            const pattern = `%${filters.search}%`;
            // The reply address only when there is one, so a search for «@»
            // does not drag in every ticket that has no address at all.
            const match = or(
                ilike(feedback.description, pattern),
                and(isNotNull(feedback.replyEmail), ilike(feedback.replyEmail, pattern)),
            );
            if (match) conditions.push(match);
        }

        return conditions;
    }
}

/** The row shape both readers share — one projection, one mapper. */
interface RawRow {
    id: string;
    type: string;
    status: string;
    description: string;
    imageUrls: string[];
    replyEmail: string | null;
    context: unknown;
    createdAt: Date;
    authorId: string | null;
    authorEmail: string | null;
    authorBlockedAt: Date | null;
}
