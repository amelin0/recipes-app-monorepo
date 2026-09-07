export interface FaqQuestionRow {
    id: string;
    question: string;
    answer: string;
}

export class FaqQuestionEntity {
    readonly id: string;
    readonly question: string;
    readonly answer: string;

    private constructor(row: FaqQuestionRow) {
        this.id = row.id;
        this.question = row.question;
        this.answer = row.answer;
    }

    static from(row: FaqQuestionRow): FaqQuestionEntity {
        return new FaqQuestionEntity(row);
    }
}

export interface FaqTopicRow {
    id: string;
    slug: string;
    title: string;
    questions: FaqQuestionEntity[];
}

export class FaqTopicEntity {
    readonly id: string;
    readonly slug: string;
    readonly title: string;
    readonly questions: FaqQuestionEntity[];

    private constructor(row: FaqTopicRow) {
        this.id = row.id;
        this.slug = row.slug;
        this.title = row.title;
        this.questions = row.questions;
    }

    static from(row: FaqTopicRow): FaqTopicEntity {
        return new FaqTopicEntity(row);
    }
}
