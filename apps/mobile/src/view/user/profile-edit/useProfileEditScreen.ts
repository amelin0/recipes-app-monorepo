import { useCallback, useEffect, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { useGetProfile, useUpdateProfile } from '@/state/domains/user';

/**
 * Local fallback while the name field is being typed: the server derives
 * `initials` and only answers after a save, so the avatar would otherwise lag
 * a whole round trip behind the input.
 */
const buildInitials = (value: string) =>
    value
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join('');

export const useProfileEditScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);
    const { data: profile, isLoading } = useGetProfile();
    const updateProfile = useUpdateProfile();
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);

    const [name, setName] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    // Заповнюємо поле, коли профіль доїхав, але не перетираємо те, що вже
    // почали набирати: рефетч під час редагування скинув би введене.
    useEffect(() => {
        if (isDirty || !profile) return;
        setName(profile.name ?? '');
    }, [isDirty, profile]);

    const handleChangeName = useCallback((value: string) => {
        setIsDirty(true);
        setName(value);
    }, []);

    const trimmed = name.trim();

    const handleChangePhoto = useCallback(() => {
        // TODO: expo-image-picker + POST /uploads (scope `profile-photo`) —
        // презигнований аплоад є, пікера в застосунку ще немає.
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const handleSave = useCallback(() => {
        if (updateProfile.isPending || trimmed.length === 0) return;

        updateProfile.mutate(
            { name: trimmed },
            {
                onSuccess: () => {
                    // Анкета читає імʼя зі свого зрізу — тримаємо в синхроні,
                    // інакше екран привітання показав би старе.
                    setAnswer('name', trimmed);
                    ToastService.success(t('profile:settings.saved'));
                    if (router.canGoBack()) router.back();
                },
                onError: () => {
                    ToastService.error(t('common:states.error'));
                },
            },
        );
    }, [setAnswer, t, trimmed, updateProfile]);

    return {
        isLoading,
        name,
        setName: handleChangeName,
        photoUrl: profile?.photoUrl ?? null,
        initials: buildInitials(trimmed) || profile?.initials || '',
        // The design only shows the enabled state; an empty name is the one
        // case worth blocking.
        canSave: trimmed.length > 0 && !updateProfile.isPending,
        isSaving: updateProfile.isPending,
        handleChangePhoto,
        handleSave,
    };
};
