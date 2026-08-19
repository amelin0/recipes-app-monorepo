import React from 'react';

import { useUnistyles } from 'react-native-unistyles';

import { formatThousands } from '@/shared/helpers';
import { ProgressBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { TrackerCard } from './TrackerCard';

export interface StepsCardProps {
    /** Steps walked today. */
    current: number;
    /** Daily target. */
    target: number;
    onPress?: () => void;
    onAdd: () => void;
}

/** Step tracker — one continuous grey bar (805:16313). */
export const StepsCard = ({ current, target, onPress, onAdd }: StepsCardProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['tracking']);

    return (
        <TrackerCard
            title={t('tracking:home.steps')}
            value={t('tracking:home.steps-progress', {
                current: formatThousands(current),
                max: formatThousands(target),
            })}
            onPress={onPress}
            onAdd={onAdd}
        >
            {/* Grey, not accent — the design keeps the step bar neutral. */}
            <ProgressBar progress={target > 0 ? current / target : 0} color={theme.colors.semantic.darkGrey} />
        </TrackerCard>
    );
};
