import { useCallback, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import {
    FEEDBACK_DESCRIPTION_MAX,
    FEEDBACK_DESCRIPTION_MIN,
    FEEDBACK_KINDS,
    type FeedbackKind,
} from '../user.constants';

export const useFeedbackScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);

    const [kind, setKind] = useState<FeedbackKind | null>(null);
    const [description, setDescription] = useState('');
    const [email, setEmail] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    // Validation only speaks up once the user has tried to send (804:25464).
    const [submitted, setSubmitted] = useState(false);

    const trimmed = description.trim();
    const descriptionError = submitted && trimmed.length < FEEDBACK_DESCRIPTION_MIN;

    const addPhoto = useCallback(() => {
        // TODO: expo-image-picker once the upload endpoint exists.
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const removePhoto = useCallback((uri: string) => {
        setPhotos(prev => prev.filter(item => item !== uri));
    }, []);

    const handleSubmit = useCallback(() => {
        setSubmitted(true);
        if (!kind || trimmed.length < FEEDBACK_DESCRIPTION_MIN) return;

        // TODO: POST /feedback once the API ships.
        router.replace('/(app)/feedback-sent');
    }, [kind, trimmed]);

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
        handleSubmit,
    };
};
