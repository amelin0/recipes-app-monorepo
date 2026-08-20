import { useState } from 'react';
import type { ImageSourcePropType } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import { MOCK_CREATE_DISH_INGREDIENTS, MOCK_CREATE_DISH_PHOTO, type CreateDishIngredient } from '../recipe.constants';

export const useCreateDishScreen = () => {
    const { t } = useAppTranslation(['recipes', 'common']);
    // Прийом, з якого відкрили створення — поїде далі на екран успіху.
    const params = useLocalSearchParams<{ day?: string; meal?: string }>();

    const [name, setName] = useState('');
    const [nameError, setNameError] = useState<string | undefined>(undefined);
    const [cuisine, setCuisine] = useState('cuisine-greek');
    const [photo, setPhoto] = useState<ImageSourcePropType | null>(null);
    const [ingredients, setIngredients] = useState<CreateDishIngredient[]>(MOCK_CREATE_DISH_INGREDIENTS);

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

    const handleRemoveIngredient = (id: string) => setIngredients(current => current.filter(item => item.id !== id));

    const handleSavePress = () => {
        // «Назва страви*» — єдине обовʼязкове поле форми.
        if (name.trim().length === 0) {
            setNameError(t('recipes:create-dish.name-required'));
            return;
        }
        // Кроків у мокові ще немає — дизайн питає, чи зберегти без них (626:24888).
        setSaveSheetVisible(true);
    };

    const handleConfirmSave = () => {
        setSaveSheetVisible(false);
        // TODO: POST /recipes once the API ships — екран успіху бере мок.
        router.replace({
            pathname: '/(app)/dish-created',
            params: { day: params.day ?? '', meal: params.meal ?? '' },
        });
    };

    return {
        name,
        nameError,
        cuisine,
        photo,
        ingredients,
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
        // TODO: кроки приготування — окремі екрани секції 594:31929.
        handleNextSteps: () => ToastService.info(t('common:states.coming-soon')),
        handleAddSteps: () => {
            setSaveSheetVisible(false);
            ToastService.info(t('common:states.coming-soon'));
        },
        handleSavePress,
        handleConfirmSave,
        handleSaveSheetClose: () => setSaveSheetVisible(false),
    };
};
