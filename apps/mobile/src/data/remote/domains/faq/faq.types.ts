export interface FaqQuestion {
    id: string;
    question: string;
    answer: string;
}

/** One accordion card on the FAQ screen; the order the API returns is the order shown. */
export interface FaqTopic {
    id: string;
    slug: string;
    title: string;
    questions: FaqQuestion[];
}
