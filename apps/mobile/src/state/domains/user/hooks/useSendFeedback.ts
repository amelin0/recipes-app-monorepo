import { useMutation } from '@tanstack/react-query';

import { UserApi, type CreateFeedbackPayload } from '@/data';

/**
 * Support ticket. Nothing to invalidate — the client only ever creates, and
 * there is no route that reads tickets back.
 */
export const useSendFeedback = () =>
    useMutation({
        mutationFn: (payload: CreateFeedbackPayload) => UserApi.sendFeedback(payload),
    });
