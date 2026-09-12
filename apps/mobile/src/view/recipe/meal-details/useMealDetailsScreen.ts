import { useCallback, useMemo, useRef, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetRecipe, useToggleFavorite } from '@/state/domains/catalog';
import { resolvePlanDate, resolvePlanMeal, useAddPlanItem } from '@/state/domains/meal-plan';

import { RECIPE_PLACEHOLDER_IMAGE, type MealIngredient, type MealStep } from '../recipe.constants';

export type MealDetailsTab = 'ingredients' | 'method';

/**
 * Ingredients have no picture and no emoji in the payload — one tile for all
 * of them, since inferring an emoji from a product name would be wrong more
 * often than right.
 */
const INGREDIENT_EMOJI = '🥄';

export const useMealDetailsScreen = () => {
    const { t } = useAppTranslation(['recipes', 'common']);
    const params = useLocalSearchParams<{ id?: string; mode?: string; day?: string; meal?: string }>();
    const recipeId = typeof params.id === 'string' ? params.id : '';

    const { data: recipe, isLoading, isError, refetch } = useGetRecipe(recipeId);
    const toggleFavorite = useToggleFavorite();

    // Відкрито з пікера — CTA додає страву до прийому (984:58839).
    const isPlanMode = params.mode === 'plan';
    const addPlanItem = useAddPlanItem();
    const day = resolvePlanDate(params.day);
    const mealKey = resolvePlanMeal(params.meal);

    // Інгредієнти — перша вкладка й та, з якої екран відкривається (984:58839).
    const [activeTab, setActiveTab] = useState<MealDetailsTab>('ingredients');

    const showComingSoon = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    /**
     * The screen's own shape, assembled from the recipe.
     *
     * Totals are for the whole dish; the summary row shows those, and the
     * portion picker works off `perPortion` — the two are different numbers
     * whenever a recipe serves more than one.
     */
    const meal = useMemo(() => {
        const ingredients: MealIngredient[] = (recipe?.ingredients ?? []).map(ingredient => ({
            id: ingredient.id,
            emoji: INGREDIENT_EMOJI,
            name: ingredient.name,
            protein: Math.round(ingredient.proteinG),
            fats: Math.round(ingredient.fatsG),
            carbs: Math.round(ingredient.carbsG),
            grams: Math.round(ingredient.amountG),
        }));

        const steps: MealStep[] = (recipe?.steps ?? []).map(step => ({
            id: step.id,
            title: step.title,
            description: step.description ?? '',
            // Кроки посилаються на інгредієнти за id — розкриваємо в назви,
            // бо чипи під кроком показують саме їх.
            ingredients: step.ingredientIds.flatMap(id => {
                const match = ingredients.find(item => item.id === id);
                return match ? [match.name] : [];
            }),
            minutes: step.durationMinutes ?? 0,
        }));

        return {
            id: recipe?.id ?? recipeId,
            title: recipe?.title ?? '',
            emoji: '🍽️',
            cuisine: recipe?.cuisine?.name ?? '',
            minutes: recipe?.cookTimeMinutes ?? 0,
            kcal: Math.round(recipe?.total.calories ?? 0),
            protein: Math.round(recipe?.total.proteinG ?? 0),
            fats: Math.round(recipe?.total.fatsG ?? 0),
            carbs: Math.round(recipe?.total.carbsG ?? 0),
            image: recipe?.photoUrl ? { uri: recipe.photoUrl } : RECIPE_PLACEHOLDER_IMAGE,
            ingredients,
            steps,
            perPortion: {
                grams: Math.round(recipe?.perServing.weightG ?? 0),
                kcal: Math.round(recipe?.perServing.calories ?? 0),
                protein: Math.round(recipe?.perServing.proteinG ?? 0),
                fats: Math.round(recipe?.perServing.fatsG ?? 0),
                carbs: Math.round(recipe?.perServing.carbsG ?? 0),
            },
        };
    }, [recipe, recipeId]);

    // Guard: навігація асинхронна — подвійний тап не має дублювати страву.
    const addedToPlan = useRef(false);
    const handleAddToPlan = useCallback(() => {
        if (addedToPlan.current || !recipe || addPlanItem.isPending) return;
        addedToPlan.current = true;

        addPlanItem.mutate(
            { date: day, slot: mealKey, recipeId: recipe.id },
            {
                onSuccess: () => {
                    if (router.canGoBack()) router.back();
                    else router.replace('/(app)/(tabs)/meal-plan');
                },
                onError: () => {
                    // Не вийшло — знімаємо запобіжник, інакше друга спроба
                    // мовчки нічого не зробить.
                    addedToPlan.current = false;
                    ToastService.error(t('common:states.error'));
                },
            },
        );
    }, [addPlanItem, day, mealKey, recipe, t]);

    return {
        meal,
        isLoading,
        isError,
        handleRetry: refetch,
        isPlanMode,
        activeTab,
        setActiveTab: (key: string) => setActiveTab(key as MealDetailsTab),
        isFavorite: recipe?.isFavorite ?? false,
        handleToggleFavorite: () => {
            if (!recipe) return;
            toggleFavorite.mutate({ id: recipe.id, isFavorite: recipe.isFavorite });
        },
        // TODO: редагування страви — `PUT /recipes/:id` в API немає (§4.7).
        handleEdit: showComingSoon,
        handleShare: showComingSoon,
        handleAddToPlan,
        isAddingToPlan: addPlanItem.isPending,
        // Logging a meal starts with how much of it was eaten. The slot and
        // day travel along when the screen was opened from a plan meal —
        // otherwise the entry would land in today's lunch by default.
        handleLogMeal: () =>
            router.push({
                pathname: '/(app)/meal-portions',
                params: isPlanMode ? { id: meal.id, slot: mealKey, date: day } : { id: meal.id },
            }),
    };
};
