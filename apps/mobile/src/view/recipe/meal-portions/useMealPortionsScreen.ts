import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import { MOCK_MEAL_DETAIL } from '../recipe.constants';

const PORTION_MIN = 1;
const PORTION_MAX = 20;
/** How much of the dish the plate starts on. */
const DEFAULT_SHARE = 0.5;

export const useMealPortionsScreen = () => {
    // TODO: portions for the recipe opened in meal details (id param) once the API ships.
    const meal = MOCK_MEAL_DETAIL;

    const [portions, setPortions] = useState(PORTION_MIN);
    const [share, setShare] = useState(DEFAULT_SHARE);

    const per = meal.perPortion;

    // What the user actually ate: their share of everything that was cooked.
    const myMacros = useMemo(() => {
        const eaten = portions * share;

        return {
            kcal: Math.round(per.kcal * eaten),
            protein: Math.round(per.protein * eaten),
            fats: Math.round(per.fats * eaten),
            carbs: Math.round(per.carbs * eaten),
        };
    }, [per, portions, share]);

    const handleConfirm = useCallback(() => {
        // TODO: POST the logged entry; the receipt should read it back.
        router.replace({
            pathname: '/(app)/meal-logged',
            params: { portions: String(portions * share) },
        });
    }, [portions, share]);

    return {
        image: meal.image,
        portions,
        share,
        setShare,
        canDecrease: portions > PORTION_MIN,
        myMacros,
        totalGrams: Math.round(per.grams * portions),
        handleDecrease: () => setPortions(prev => Math.max(prev - 1, PORTION_MIN)),
        handleIncrease: () => setPortions(prev => Math.min(prev + 1, PORTION_MAX)),
        handleClose: () => router.back(),
        handleConfirm,
    };
};
