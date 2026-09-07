import { ApiProperty } from '@nestjs/swagger';

import { FaqQuestionEntity, FaqTopicEntity } from '@dns/database';

export class FaqQuestionView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;
    @ApiProperty() readonly question: string;
    @ApiProperty() readonly answer: string;

    private constructor(question: FaqQuestionEntity) {
        this.id = question.id;
        this.question = question.question;
        this.answer = question.answer;
    }

    static from(question: FaqQuestionEntity): FaqQuestionView {
        return new FaqQuestionView(question);
    }
}

/** A card that opens. Collapsed is a client state — every topic ships its questions. */
export class FaqTopicView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;

    @ApiProperty({ description: 'Stable code for analytics and deep links; never displayed.' })
    readonly slug: string;

    @ApiProperty() readonly title: string;

    @ApiProperty({ type: [FaqQuestionView], description: 'In editorial order.' })
    readonly questions: FaqQuestionView[];

    private constructor(topic: FaqTopicEntity) {
        this.id = topic.id;
        this.slug = topic.slug;
        this.title = topic.title;
        this.questions = topic.questions.map(FaqQuestionView.from);
    }

    static from(topic: FaqTopicEntity): FaqTopicView {
        return new FaqTopicView(topic);
    }
}
