import { relations } from 'drizzle-orm';
import { integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * A theme on the FAQ screen — a card that opens (faq FR-001).
 *
 * Editorial copy in the database rather than in the app bundle, because
 * FR-004 asks for exactly that: the content team changes an answer without a
 * release. The same reason the filter dictionaries are tables.
 */
export const faqTopics = pgTable('faq_topics', {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const faqTopicTranslations = pgTable(
    'faq_topic_translations',
    {
        topicId: uuid('topic_id')
            .notNull()
            .references(() => faqTopics.id, { onDelete: 'cascade' }),
        language: text('language').notNull(),
        title: text('title').notNull(),
    },
    table => [primaryKey({ columns: [table.topicId, table.language] })],
);

/** One question and its answer. Order within a topic is editorial, so it is stored. */
export const faqQuestions = pgTable('faq_questions', {
    id: uuid('id').primaryKey().defaultRandom(),

    topicId: uuid('topic_id')
        .notNull()
        .references(() => faqTopics.id, { onDelete: 'cascade' }),

    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const faqQuestionTranslations = pgTable(
    'faq_question_translations',
    {
        questionId: uuid('question_id')
            .notNull()
            .references(() => faqQuestions.id, { onDelete: 'cascade' }),
        language: text('language').notNull(),
        question: text('question').notNull(),
        answer: text('answer').notNull(),
    },
    table => [primaryKey({ columns: [table.questionId, table.language] })],
);

export const faqTopicsRelations = relations(faqTopics, ({ many }) => ({
    translations: many(faqTopicTranslations),
    questions: many(faqQuestions),
}));

export const faqTopicTranslationsRelations = relations(faqTopicTranslations, ({ one }) => ({
    topic: one(faqTopics, { fields: [faqTopicTranslations.topicId], references: [faqTopics.id] }),
}));

export const faqQuestionsRelations = relations(faqQuestions, ({ one, many }) => ({
    topic: one(faqTopics, { fields: [faqQuestions.topicId], references: [faqTopics.id] }),
    translations: many(faqQuestionTranslations),
}));

export const faqQuestionTranslationsRelations = relations(faqQuestionTranslations, ({ one }) => ({
    question: one(faqQuestions, { fields: [faqQuestionTranslations.questionId], references: [faqQuestions.id] }),
}));
