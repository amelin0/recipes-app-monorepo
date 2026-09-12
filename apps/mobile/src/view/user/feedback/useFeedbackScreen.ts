import { useCallback, useState } from 'react';

import { router } from 'expo-router';
import { Platform } from 'react-native';

import { ToastService } from '@/shared/services';
import { appBuild, appVersion } from '@/shared/utils';
import { useAppTranslation } from '@/shared/utils/translations';
import { useSendFeedback } from '@/state/domains/user';

import {
    FEEDBACK_DESCRIPTION_MAX,
    FEEDBACK_DESCRIPTION_MIN,
    FEEDBACK_KIND_TO_API,
    FEEDBACK_KINDS,
    type FeedbackKind,
} from '../user.constants';

export const useFeedbackScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);
    const sendFeedback = useSendFeedback();

    const [kind, setKind] = useState<FeedbackKind | null>(null);
    const [description, setDescription] = useState('');
    const [email, setEmail] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    // Validation only speaks up once the user has tried to send (804:25464).
    const [submitted, setSubmitted] = useState(false);

    const trimmed = description.trim();
    const descriptionError = submitted && trimmed.length < FEEDBACK_DESCRIPTION_MIN;

    const addPhoto = useCallback(() => {
        // TODO: expo-image-picker + POST /uploads (scope `feedback`) — the
        // presigned upload exists, the picker does not.
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const removePhoto = useCallback((uri: string) => {
        setPhotos(prev => prev.filter(item => item !== uri));
    }, []);

    const handleSubmit = useCallback(() => {
        setSubmitted(true);
        if (!kind || trimmed.length < FEEDBACK_DESCRIPTION_MIN || sendFeedback.isPending) return;

        sendFeedback.mutate(
            {
                type: FEEDBACK_KIND_TO_API[kind],
                description: trimmed,
                // Порожнє поле — «не вказано»: сервер сам зводить його до
                // undefined, але не варто гнати туди порожній рядок.
                ...(email.trim() ? { replyEmail: email.trim() } : {}),
                // What the client can say about itself (FR-008) — saves support
                // a round trip asking which build the report came from.
                context: {
                    platform: Platform.OS,
                    osVersion: String(Platform.Version),
                    appVersion,
                    appBuild,
                },
            },
            {
                onSuccess: () => router.replace('/(app)/feedback-sent'),
                onError: () => ToastService.error(t('common:states.error')),
            },
        );
    }, [email, kind, sendFeedback, t, trimmed]);

    return {
        kinds: FEEDBACK_KINDS,
        kind,
        selectKind: setKind,
        description,
        setDescription: (value: string) => setDescription(value.slice(0, FEEDBACK_DESCRIPTION_MAX)),
        descriptionError,
        counter: `${description.length}/${FEEDBACK_DESCRIPTION_MAX}`,
        photos,
        addPhoto,
        removePhoto,
        email,
        setEmail,
        isSubmitting: sendFeedback.isPending,
        handleSubmit,
    };
};
