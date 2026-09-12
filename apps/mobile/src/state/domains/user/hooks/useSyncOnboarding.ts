import { useEffect, useRef } from 'react';

import { useStore } from '@/state';

import { useGetOnboarding } from './useOnboarding';

/**
 * Seeds the local questionnaire slice from the server, once per account.
 *
 * The slice survives a kill through MMKV, so this only matters on a fresh
 * install or a second device — but without it those start the questionnaire
 * from scratch even though the answers are already on the server.
 *
 * Only fills blanks: an answer the user has already given on this device wins
 * over the stored one, because it is the newer of the two and may be what
 * they are in the middle of changing.
 */
export const useSyncOnboarding = () => {
    const { data } = useGetOnboarding();
    const answers = useStore(state => state.profileSetup);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);

    const seeded = useRef(false);

    useEffect(() => {
        if (seeded.current || !data) return;
        seeded.current = true;

        if (!answers.name && data.name) setAnswer('name', data.name);
        if (answers.gender === null && data.gender) setAnswer('gender', data.gender);
        if (answers.birthDate === null && data.birthDate) setAnswer('birthDate', data.birthDate);
        if (answers.weightKg === null && data.weightKg !== null) setAnswer('weightKg', data.weightKg);
        if (answers.heightCm === null && data.heightCm !== null) setAnswer('heightCm', data.heightCm);
        if (answers.activityLevel === null && data.activityLevel !== null) {
            setAnswer('activityLevel', data.activityLevel);
        }
        if (answers.goal === null && data.goal) setAnswer('goal', data.goal);
        if (answers.targetWeightKg === null && data.targetWeightKg !== null) {
            setAnswer('targetWeightKg', data.targetWeightKg);
        }
        // `answers` навмисно поза залежностями: ефект читає їх один раз при
        // засіванні, а слухати їх означало б перезапускатись на кожну відповідь.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, setAnswer]);
};
