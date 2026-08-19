import { useCallback, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';

import { MOCK_PROFILE } from '../user.constants';

const buildInitials = (value: string) =>
    value
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join('');

export const useProfileEditScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);
    const storedName = useStore(state => state.profileSetup.name);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);

    const [name, setName] = useState(storedName || MOCK_PROFILE.name);

    const trimmed = name.trim();

    const handleChangePhoto = useCallback(() => {
        // TODO: photo upload — the avatar has no image variant yet.
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const handleSave = useCallback(() => {
        // TODO: PATCH /me once the API ships — the questionnaire's answer is the
        // only place a name lives today.
        setAnswer('name', trimmed);
        ToastService.success(t('profile:edit-screen.saved'));
        if (router.canGoBack()) {
            router.back();
        }
    }, [setAnswer, trimmed, t]);

    return {
        name,
        setName,
        initials: buildInitials(trimmed || MOCK_PROFILE.name),
        // The design only shows the enabled state; an empty name is the one
        // case worth blocking.
        canSave: trimmed.length > 0,
        handleChangePhoto,
        handleSave,
    };
};
