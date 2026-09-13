import { useCallback, useMemo, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import type { CreateRecipeStepPayload, Product, Reference } from '@/data';
import { useActionLock } from '@/shared/hooks';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useCreateRecipe, useGetRecipeFilters } from '@/state/domains/catalog';

import type { CreateDishIngredient, DishStep } from '../recipe.constants';

let stepSequence = 0;

// Унікальний і між сесіями форми, і після Fast Refresh у дев-збірці.
const makeEmptyStep = (): DishStep => {
    stepSequence += 1;
    return {
        id: `step-${Date.now()}-${stepSequence}`,
        title: '',
        description: '',
        ingredientIds: [],
        minutes: 1,
    };
};

/** Default weight a freshly picked ingredient starts at, in grams. */
const DEFAULT_INGREDIENT_GRAMS = 100;

export const useCreateDishScreen = () => {
    const { t } = useAppTranslation(['recipes', 'common']);
    // Прийом, з якого відкрили створення — поїде далі на екран успіху.
    const params = useLocalSearchParams<{ day?: string; meal?: string }>();

    const { data: filterOptions } = useGetRecipeFilters();
    const createRecipe = useCreateRecipe();

    const [name, setName] = useState('');
    const [nameError, setNameError] = useState<string | undefined>(undefined);
    const [cuisineId, setCuisineId] = useState<string | null>(null);
    // Фото страви — публічний URL із `POST /uploads`. Поки лишається null:
    // пікера зображень у застосунку немає (§4.9), а `setPhoto` зʼявиться
    // разом із ним.
    const [photo] = useState<string | null>(null);
    // Порожньо на старті: страва складається з того, що обрали, а не з
    // підставленого набору, який довелось би вичищати.
    const [ingredients, setIngredients] = useState<CreateDishIngredient[]>([]);

    const [steps, setSteps] = useState<DishStep[]>(() => [makeEmptyStep()]);
    const [stepsEditorVisible, setStepsEditorVisible] = useState(false);

    const [imageSheetVisible, setImageSheetVisible] = useState(false);
    const [photoModalVisible, setPhotoModalVisible] = useState(false);
    const [cuisineSheetVisible, setCuisineSheetVisible] = useState(false);
    const [ingredientSheetVisible, setIngredientSheetVisible] = useState(false);
    const [saveSheetVisible, setSaveSheetVisible] = useState(false);

    const cuisines: Reference[] = useMemo(() => filterOptions?.cuisines ?? [], [filterOptions]);
    const cuisine = cuisines.find(item => item.id === cuisineId) ?? null;

    const handleNameChange = (value: string) => {
        setName(value);
        if (nameError !== undefined) setNameError(undefined);
    };

    const handleGramsChange = (id: string, grams: string) => {
        // Поле приймає лише цілі грами — вставки на кшталт «-50» чи «12,5»
        // зводяться до цифр.
        const value = Number.parseInt(grams.replace(/\D/g, ''), 10);
        setIngredients(current =>
            current.map(item => (item.id === id ? { ...item, grams: Number.isNaN(value) ? 0 : value } : item)),
        );
    };

    const handleRemoveIngredient = (id: string) => {
        setIngredients(current => current.filter(item => item.id !== id));
        // Кроки не мають посилатися на знятий інгредієнт.
        setSteps(current =>
            current.map(step => ({ ...step, ingredientIds: step.ingredientIds.filter(item => item !== id) })),
        );
    };

    const handleAddIngredients = useCallback((products: Product[]) => {
        setIngredients(current => [
            ...current,
            ...products
                .filter(product => !current.some(item => item.id === product.id))
                .map(product => ({
                    id: product.id,
                    emoji: product.group?.emoji ?? '🥄',
                    name: product.name,
                    // Per-100g figures scaled to the starting weight, so the
                    // row reads right before anybody touches the grams.
                    protein: Math.round((product.proteinPer100g * DEFAULT_INGREDIENT_GRAMS) / 100),
                    fats: Math.round((product.fatsPer100g * DEFAULT_INGREDIENT_GRAMS) / 100),
                    carbs: Math.round((product.carbsPer100g * DEFAULT_INGREDIENT_GRAMS) / 100),
                    grams: DEFAULT_INGREDIENT_GRAMS,
                })),
        ]);
        setIngredientSheetVisible(false);
    }, []);

    // Крок рахується, щойно його чимось заповнили — текстом, чипсами чи часом.
    const hasSteps = steps.some(
        step =>
            step.title.trim().length > 0 ||
            step.description.trim().length > 0 ||
            step.ingredientIds.length > 0 ||
            step.minutes > 1,
    );

    // Три кнопки ведуть в один обробник — замок один на всі три. Після успіху
    // лишається взятим: екран іде на квитанцію створеної страви.
    const lock = useActionLock();

    const handleConfirmSave = useCallback(() => {
        setSaveSheetVisible(false);
        if (!lock.acquire()) return;

        const filled = steps.filter(step => step.title.trim().length > 0 || step.description.trim().length > 0);

        const payload = {
            title: name.trim(),
            ...(cuisineId ? { cuisineId } : {}),
            ...(photo ? { photoUrl: photo } : {}),
            ingredients: ingredients
                .filter(item => item.grams > 0)
                .map(item => ({ productId: item.id, amountG: item.grams })),
            ...(filled.length > 0
                ? {
                      steps: filled.map<CreateRecipeStepPayload>(step => ({
                          title: step.title.trim() || null,
                          description: step.description.trim() || null,
                          durationMinutes: step.minutes > 0 ? step.minutes : null,
                          // Сервер звʼязує крок з інгредієнтом за індексом у
                          // масиві — самих інгредієнтів ще не існує.
                          ingredientIndexes: step.ingredientIds
                              .map(id => ingredients.findIndex(item => item.id === id))
                              .filter(index => index >= 0),
                      })),
                  }
                : {}),
        };

        createRecipe.mutate(payload, {
            onSuccess: recipe => {
                router.replace({
                    pathname: '/(app)/dish-created',
                    params: { id: recipe.id, day: params.day ?? '', meal: params.meal ?? '' },
                });
            },
            onError: () => {
                ToastService.error(t('common:states.error'));
                lock.release();
            },
        });
    }, [createRecipe, cuisineId, ingredients, lock, name, params.day, params.meal, photo, steps, t]);

    const handleSavePress = () => {
        // «Назва страви*» — єдине обовʼязкове поле форми.
        if (name.trim().length === 0) {
            setNameError(t('recipes:create-dish.name-required'));
            return;
        }
        // Без інгредієнтів страви не буває: сервер рахує з них КБЖВ, і
        // порожній склад він відхилить 422.
        if (ingredients.length === 0) {
            ToastService.error(t('recipes:create-dish.ingredients-required'));
            return;
        }
        // Без кроків дизайн перепитує (626:24888); з ними — зберігаємо одразу.
        if (hasSteps) {
            handleConfirmSave();
            return;
        }
        setSaveSheetVisible(true);
    };

    const handleStepChange = (id: string, patch: Partial<DishStep>) =>
        setSteps(current => current.map(step => (step.id === id ? { ...step, ...patch } : step)));

    return {
        name,
        nameError,
        cuisines,
        cuisineId,
        cuisineName: cuisine?.name ?? '',
        photo,
        ingredients,
        steps,
        isSaving: createRecipe.isPending || lock.isBusy(),
        stepsEditorVisible,
        imageSheetVisible,
        photoModalVisible,
        cuisineSheetVisible,
        ingredientSheetVisible,
        saveSheetVisible,
        handleNameChange,
        handleGramsChange,
        handleRemoveIngredient,
        handlePhotoPress: () => setImageSheetVisible(true),
        // TODO: expo-image-picker + POST /uploads (scope `recipe-photo`) —
        // презигнований аплоад є, пікера в застосунку ще немає (§4.9).
        handlePickPhoto: () => {
            setImageSheetVisible(false);
            ToastService.info(t('common:states.coming-soon'));
        },
        handleTakePhoto: () => {
            setImageSheetVisible(false);
            setPhotoModalVisible(true);
        },
        handlePhotoSave: () => {
            setPhotoModalVisible(false);
            ToastService.info(t('common:states.coming-soon'));
        },
        handlePhotoClose: () => setPhotoModalVisible(false),
        handleImageSheetClose: () => setImageSheetVisible(false),
        handleCuisinePress: () => setCuisineSheetVisible(true),
        handleCuisineApply: (id: string) => {
            setCuisineId(id);
            setCuisineSheetVisible(false);
        },
        handleCuisineSheetClose: () => setCuisineSheetVisible(false),
        handleAddIngredient: () => setIngredientSheetVisible(true),
        handleAddIngredients,
        handleIngredientSheetClose: () => setIngredientSheetVisible(false),
        // Редактор кроків «Приготування» (594:32174).
        handleNextSteps: () => setStepsEditorVisible(true),
        handleAddSteps: () => {
            setSaveSheetVisible(false);
            setStepsEditorVisible(true);
        },
        handleStepChange,
        handleAddStep: () => setSteps(current => [...current, makeEmptyStep()]),
        handleStepsEditorClose: () => setStepsEditorVisible(false),
        // «Зберегти» в редакторі зберігає всю страву (594:32174); без назви
        // повертаємо на форму з помилкою обовʼязкового поля.
        handleStepsSave: () => {
            setStepsEditorVisible(false);
            if (name.trim().length === 0) {
                setNameError(t('recipes:create-dish.name-required'));
                return;
            }
            handleConfirmSave();
        },
        handleSavePress,
        handleConfirmSave,
        handleSaveSheetClose: () => setSaveSheetVisible(false),
    };
};
