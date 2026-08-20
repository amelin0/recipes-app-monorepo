import { useState } from 'react';
import type { ImageSourcePropType } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import {
    MOCK_CREATE_DISH_INGREDIENTS,
    MOCK_CREATE_DISH_PHOTO,
    type CreateDishIngredient,
    type DishStep,
} from '../recipe.constants';

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

export const useCreateDishScreen = () => {
    const { t } = useAppTranslation(['recipes', 'common']);
    // Прийом, з якого відкрили створення — поїде далі на екран успіху.
    const params = useLocalSearchParams<{ day?: string; meal?: string }>();

    const [name, setName] = useState('');
    const [nameError, setNameError] = useState<string | undefined>(undefined);
    const [cuisine, setCuisine] = useState('cuisine-greek');
    const [photo, setPhoto] = useState<ImageSourcePropType | null>(null);
    const [ingredients, setIngredients] = useState<CreateDishIngredient[]>(MOCK_CREATE_DISH_INGREDIENTS);

    const [steps, setSteps] = useState<DishStep[]>(() => [makeEmptyStep()]);
    const [stepsEditorVisible, setStepsEditorVisible] = useState(false);

    const [imageSheetVisible, setImageSheetVisible] = useState(false);
    const [photoModalVisible, setPhotoModalVisible] = useState(false);
    const [cuisineSheetVisible, setCuisineSheetVisible] = useState(false);
    const [saveSheetVisible, setSaveSheetVisible] = useState(false);

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

    const handleConfirmSave = () => {
        setSaveSheetVisible(false);
        // TODO: POST /recipes once the API ships — екран успіху бере мок.
        router.replace({
            pathname: '/(app)/dish-created',
            params: { day: params.day ?? '', meal: params.meal ?? '' },
        });
    };

    // Крок рахується, щойно його чимось заповнили — текстом, чипсами чи часом.
    const hasSteps = steps.some(
        step =>
            step.title.trim().length > 0 ||
            step.description.trim().length > 0 ||
            step.ingredientIds.length > 0 ||
            step.minutes > 1,
    );

    const handleSavePress = () => {
        // «Назва страви*» — єдине обовʼязкове поле форми.
        if (name.trim().length === 0) {
            setNameError(t('recipes:create-dish.name-required'));
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
        cuisine,
        photo,
        ingredients,
        steps,
        stepsEditorVisible,
        imageSheetVisible,
        photoModalVisible,
        cuisineSheetVisible,
        saveSheetVisible,
        handleNameChange,
        handleGramsChange,
        handleRemoveIngredient,
        handlePhotoPress: () => setImageSheetVisible(true),
        // TODO: expo-image-picker — поки підставляємо мок-фото (594:32413).
        handlePickPhoto: () => {
            setImageSheetVisible(false);
            setPhoto(MOCK_CREATE_DISH_PHOTO);
        },
        handleTakePhoto: () => {
            setImageSheetVisible(false);
            setPhotoModalVisible(true);
        },
        handlePhotoSave: () => {
            setPhotoModalVisible(false);
            setPhoto(MOCK_CREATE_DISH_PHOTO);
        },
        handlePhotoClose: () => setPhotoModalVisible(false),
        handleImageSheetClose: () => setImageSheetVisible(false),
        handleCuisinePress: () => setCuisineSheetVisible(true),
        handleCuisineApply: (key: string) => {
            setCuisine(key);
            setCuisineSheetVisible(false);
        },
        handleCuisineSheetClose: () => setCuisineSheetVisible(false),
        // TODO: флоу «Додати інгредієнт» — окремі екрани секції 594:31929.
        handleAddIngredient: () => ToastService.info(t('common:states.coming-soon')),
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
