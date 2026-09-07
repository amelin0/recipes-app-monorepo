import { Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DEFAULT_LANGUAGE } from '@dns/constants';

import { FaqQuestionEntity, FaqTopicEntity } from '../../entities';
import { faqQuestionTranslations, faqQuestions, faqTopicTranslations, faqTopics } from '../../schema';
import { BaseRepository } from '../base.repository';

@Injectable()
export class FaqRepository extends BaseRepository {
    /**
     * Every topic with its questions, in editorial order, in one read.
     *
     * The screen shows all of it at once — the cards are collapsed, not
     * unloaded (faq FR-002) — so paging or a per-topic route would only add
     * round trips to a screen that has no scroll worth saving.
     */
    async findAll(language: string): Promise<FaqTopicEntity[]> {
        const topicPreferred = alias(faqTopicTranslations, 'preferred_topic_title');
        const topicFallback = alias(faqTopicTranslations, 'fallback_topic_title');
        const questionPreferred = alias(faqQuestionTranslations, 'preferred_question_text');
        const questionFallback = alias(faqQuestionTranslations, 'fallback_question_text');

        const topicTitle = sql<string>`coalesce(${topicPreferred.title}, ${topicFallback.title})`;
        const question = sql<string>`coalesce(${questionPreferred.question}, ${questionFallback.question})`;
        const answer = sql<string>`coalesce(${questionPreferred.answer}, ${questionFallback.answer})`;

        const rows = await this.db
            .select({
                topicId: faqTopics.id,
                slug: faqTopics.slug,
                topicSortOrder: faqTopics.sortOrder,
                topicTitle,
                questionId: faqQuestions.id,
                questionSortOrder: faqQuestions.sortOrder,
                question,
                answer,
            })
            .from(faqTopics)
            .leftJoin(
                topicPreferred,
                and(eq(topicPreferred.topicId, faqTopics.id), eq(topicPreferred.language, language)),
            )
            .leftJoin(
                topicFallback,
                and(eq(topicFallback.topicId, faqTopics.id), eq(topicFallback.language, DEFAULT_LANGUAGE)),
            )
            .leftJoin(faqQuestions, eq(faqQuestions.topicId, faqTopics.id))
            .leftJoin(
                questionPreferred,
                and(eq(questionPreferred.questionId, faqQuestions.id), eq(questionPreferred.language, language)),
            )
            .leftJoin(
                questionFallback,
                and(eq(questionFallback.questionId, faqQuestions.id), eq(questionFallback.language, DEFAULT_LANGUAGE)),
            )
            .where(sql`${topicTitle} is not null`)
            .orderBy(asc(faqTopics.sortOrder), asc(faqQuestions.sortOrder));

        const topics = new Map<string, { slug: string; title: string; questions: FaqQuestionEntity[] }>();

        for (const row of rows) {
            const topic = topics.get(row.topicId) ?? { slug: row.slug, title: row.topicTitle, questions: [] };
            topics.set(row.topicId, topic);

            // The left join yields one null-question row for a topic that has
            // none — a topic the content team has started but not filled.
            if (row.questionId === null || row.question === null) continue;

            topic.questions.push(
                FaqQuestionEntity.from({ id: row.questionId, question: row.question, answer: row.answer }),
            );
        }

        return [...topics].map(([id, topic]) => FaqTopicEntity.from({ id, ...topic }));
    }
}
