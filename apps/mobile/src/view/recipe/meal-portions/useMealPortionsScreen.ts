import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import { MOCK_MEAL_DETAIL } from '../recipe.constants';

const PORTION_STEP = 0.5;
const PORTION_MIN = 0.5;
const PORTION_MAX = 20;

const clampPortion = (value: number) => Math.min(Math.max(value, PORTION_MIN), PORTION_MAX);

export const useMealPortionsScreen = () => {
    const { t } = useAppTranslation(['recipes', 'common']);
    // TODO: portions for the recipe opened in meal details (id param) once the API ships.
    const meal = MOCK_MEAL_DETAIL;

    const [myPortions, setMyPortions] = useState(1);
    const [othersPortions, setOthersPortions] = useState(1);
    const [forOthers, setForOthers] = useState(false);

    const per = meal.perPortion;
    const myGrams = Math.round(per.grams * myPortions);
    const othersGrams = forOthers ? Math.round(per.grams * othersPortions) : 0;

    const myMacros = useMemo(
        () => ({
            kcal: Math.round(per.kcal * myPortions),
            protein: Math.round(per.protein * myPortions),
            fats: Math.round(per.fats * myPortions),
            carbs: Math.round(per.carbs * myPortions),
        }),
        [per, myPortions],
    );

    const handleStartCooking = useCallback(() => {
        // TODO: cooking mode once designed.
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    return {
        myPortions,
        othersPortions,
        forOthers,
        setForOthers,
        myGrams,
        othersGrams,
        totalGrams: myGrams + othersGrams,
        myMacros,
        handleMyDecrease: () => setMyPortions(prev => clampPortion(prev - PORTION_STEP)),
        handleMyIncrease: () => setMyPortions(prev => clampPortion(prev + PORTION_STEP)),
        handleOthersDecrease: () => setOthersPortions(prev => clampPortion(prev - PORTION_STEP)),
        handleOthersIncrease: () => setOthersPortions(prev => clampPortion(prev + PORTION_STEP)),
        handleClose: () => router.back(),
        handleStartCooking,
    };
};
