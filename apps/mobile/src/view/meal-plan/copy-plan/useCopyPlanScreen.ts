import { useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import { MOCK_COPY_NEXT_WEEK, MOCK_COPY_THIS_WEEK } from '../meal-plan.constants';

export type CopyWeekTab = 'this' | 'next';

export const useCopyPlanScreen = () => {
    const { t } = useAppTranslation(['meal-plan']);

    const [activeTab, setActiveTab] = useState<CopyWeekTab>('this');
    const [selected, setSelected] = useState<string[]>([]);

    return {
        activeTab,
        setActiveTab: (key: string) => setActiveTab(key as CopyWeekTab),
        days: activeTab === 'this' ? MOCK_COPY_THIS_WEEK : MOCK_COPY_NEXT_WEEK,
        selected,
        handleToggle: (key: string) =>
            setSelected(prev => (prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key])),
        handleClose: () => {
            if (router.canGoBack()) router.back();
        },
        handleApply: () => {
            // TODO: POST /meal-plan/copy with the selected days once the API ships.
            if (router.canGoBack()) router.back();
            ToastService.success(t('meal-plan:copy.copied'));
        },
    };
};
