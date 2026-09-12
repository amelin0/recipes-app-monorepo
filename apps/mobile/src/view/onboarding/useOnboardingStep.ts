import { useCallback } from 'react';

import type { SaveOnboardingPayload } from '@/data';
import { useSaveOnboarding } from '@/state/domains/user';

/**
 * Sends the answer just given, together with the step it came from, so an
 * interrupted questionnaire resumes where it stopped.
 *
 * Fire-and-forget by design: the answer is already in the local slice, which
 * is what every screen renders from. A failed write costs the resume point on
 * another device, not the answer — and awaiting the network on «Далі» would
 * turn a fourteen-step form into fourteen loading screens.
 */
export const useOnboardingStep = (step: number) => {
    const save = useSaveOnboarding();

    return useCallback(
        (answers: SaveOnboardingPayload) => {
            save.mutate({ ...answers, step });
        },
        [save, step],
    );
};
