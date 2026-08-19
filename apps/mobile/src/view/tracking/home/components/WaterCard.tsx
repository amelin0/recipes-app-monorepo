import React from 'react';

import { SegmentedProgressBar } from '@/shared/ui/components';
import { formatThousands } from '@/shared/helpers';
import { useAppTranslation } from '@/shared/utils/translations';

import { TrackerCard } from './TrackerCard';

export interface WaterCardProps {
    /** Consumed volume, ml. */
    current: number;
    /** Daily target, ml. */
    target: number;
    /** Number of bar segments. @default 10 */
    segments?: number;
    onPress?: () => void;
    onAdd: () => void;
}

/** Water tracker — segmented bar, one segment per tenth of the target (435:6144). */
export const WaterCard = ({ current, target, segments = 10, onPress, onAdd }: WaterCardProps) => {
    const { t } = useAppTranslation(['tracking']);
    // Fractional on purpose: 240 of 2,000 ml part-fills the second segment.
    const filled = target > 0 ? (current / target) * segments : 0;

    return (
        <TrackerCard
            title={t('tracking:home.water')}
            value={t('tracking:home.water-progress', {
                current: formatThousands(current),
                max: formatThousands(target),
            })}
            onPress={onPress}
            onAdd={onAdd}
        >
            <SegmentedProgressBar segments={segments} filled={filled} />
        </TrackerCard>
    );
};
