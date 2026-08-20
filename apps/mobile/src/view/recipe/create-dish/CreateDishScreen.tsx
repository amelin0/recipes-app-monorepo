import React from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppInput, AppScreen, AppText, CircleBackButton, ConfirmSheet } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import ArrowDownIcon from '../../../../assets/icons/arrow-down-large.svg';
import CameraLargeIcon from '../../../../assets/icons/camera-large.svg';
import { OPTION_EMOJI } from '../recipe.constants';

import { AddImageSheet, CuisineSheet, IngredientEditRow, StepsEditorModal, TakePhotoModal } from './components';

import { useCreateDishScreen } from './useCreateDishScreen';

/** Додати страву — форма створення власної страви (594:31930). */
export const CreateDishScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes', 'common']);
    const {
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
        handlePhotoPress,
        handlePickPhoto,
        handleTakePhoto,
        handlePhotoSave,
        handlePhotoClose,
        handleImageSheetClose,
        handleCuisinePress,
        handleCuisineApply,
        handleCuisineSheetClose,
        handleAddIngredient,
        handleNextSteps,
        handleAddSteps,
        handleStepChange,
        handleAddStep,
        handleStepsEditorClose,
        handleStepsSave,
        handleSavePress,
        handleConfirmSave,
        handleSaveSheetClose,
    } = useCreateDishScreen();

    return (
        <AppScreen>
            <View style={styles.headerBar}>
                <View style={styles.headerSide}>
                    <CircleBackButton />
                </View>
                <AppText variant="bodyLargeBold" style={styles.headerTitle}>
                    {t('recipes:create-dish.title')}
                </AppText>
                <View style={[styles.headerSide, styles.headerSideEnd]}>
                    <Pressable accessibilityRole="button" onPress={handleSavePress} style={styles.savePill}>
                        <AppText variant="bodyMediumBold" numberOfLines={1}>
                            {t('common:actions.save')}
                        </AppText>
                    </Pressable>
                </View>
            </View>

            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('recipes:create-dish.add-photo')}
                        onPress={handlePhotoPress}
                        style={styles.photoBox}
                    >
                        {photo ? (
                            <Image
                                source={photo}
                                accessibilityLabel={t('recipes:create-dish.photo-a11y')}
                                style={styles.photo}
                                resizeMode="cover"
                            />
                        ) : (
                            <>
                                <CameraLargeIcon width={40} height={40} color={theme.colors.elements.primary} />
                                <AppText variant="bodySmallBold">{t('recipes:create-dish.add-photo')}</AppText>
                            </>
                        )}
                    </Pressable>

                    <AppInput
                        label={t('recipes:create-dish.name-label')}
                        placeholder={t('recipes:create-dish.name-placeholder')}
                        value={name}
                        onChangeText={handleNameChange}
                        errorText={nameError}
                        autoCorrect={false}
                    />

                    <View style={styles.field}>
                        <AppText variant="bodyMediumBold">{t('recipes:create-dish.cuisine-label')}</AppText>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t('recipes:create-dish.cuisine-label')}
                            onPress={handleCuisinePress}
                            style={styles.dropdown}
                        >
                            <AppText variant="bodyMediumReg" style={styles.dropdownValue}>
                                {`${OPTION_EMOJI[cuisine]} ${t(`recipes:options.${cuisine}`)}`}
                            </AppText>
                            <ArrowDownIcon width={20} height={20} color={theme.colors.elements.primary} />
                        </Pressable>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <AppText variant="bodyLargeBold" accessibilityRole="header" style={styles.sectionTitle}>
                                {t('recipes:create-dish.ingredients')}
                            </AppText>
                            <Pressable accessibilityRole="button" hitSlop={8} onPress={handleAddIngredient}>
                                <AppText variant="bodySmallReg" style={styles.addLink}>
                                    {t('recipes:create-dish.add-ingredient')}
                                </AppText>
                            </Pressable>
                        </View>
                        {ingredients.map(ingredient => (
                            <IngredientEditRow
                                key={ingredient.id}
                                ingredient={ingredient}
                                onGramsChange={grams => handleGramsChange(ingredient.id, grams)}
                                onRemove={() => handleRemoveIngredient(ingredient.id)}
                            />
                        ))}
                    </View>

                    <AppButton fullWidth label={t('recipes:create-dish.next-steps')} onPress={handleNextSteps} />
                </ScrollView>
            </KeyboardAvoidingView>

            <AddImageSheet
                visible={imageSheetVisible}
                onPickPhoto={handlePickPhoto}
                onTakePhoto={handleTakePhoto}
                onClose={handleImageSheetClose}
            />
            <TakePhotoModal visible={photoModalVisible} onSave={handlePhotoSave} onClose={handlePhotoClose} />
            <StepsEditorModal
                visible={stepsEditorVisible}
                steps={steps}
                ingredients={ingredients}
                onStepChange={handleStepChange}
                onAddStep={handleAddStep}
                onSave={handleStepsSave}
                onClose={handleStepsEditorClose}
            />
            <CuisineSheet
                visible={cuisineSheetVisible}
                selected={cuisine}
                onApply={handleCuisineApply}
                onClose={handleCuisineSheetClose}
            />
            <ConfirmSheet
                visible={saveSheetVisible}
                title={t('recipes:create-dish.save-title')}
                description={t('recipes:create-dish.save-subtitle')}
                confirmLabel={t('recipes:create-dish.save-confirm')}
                onConfirm={handleConfirmSave}
                cancelLabel={t('recipes:create-dish.add-steps')}
                onCancel={handleAddSteps}
                onDismiss={handleSaveSheetClose}
                closeAccessibilityLabel={t('common:actions.close')}
            />
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[2],
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
    },
    // Рівні фланги тримають заголовок по центру екрана (594:32032).
    headerSide: {
        width: 90,
        flexDirection: 'row',
    },
    headerSideEnd: {
        justifyContent: 'flex-end',
    },
    savePill: {
        minHeight: 44,
        paddingHorizontal: theme.spacing[3],
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        // Той самий liquid-філ, що й у кнопки «назад» поруч (594:32037).
        backgroundColor: theme.colors.semantic.white30,
    },
    flex: {
        flex: 1,
    },
    scroll: {
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[2],
        paddingBottom: theme.spacing[10],
        gap: theme.spacing[4],
    },
    photoBox: {
        height: 220,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[3],
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.lightGrey,
        overflow: 'hidden',
    },
    photo: {
        ...StyleSheet.absoluteFillObject,
    },
    field: {
        gap: theme.spacing[1],
        width: '100%',
    },
    // Той самий вигляд, що й у текстового поля вище (626:24867).
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        minHeight: 48,
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[2],
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.background.screen,
    },
    dropdownValue: {
        flex: 1,
    },
    section: {
        gap: theme.spacing[2],
        width: '100%',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        marginBottom: theme.spacing[1],
    },
    sectionTitle: {
        flex: 1,
    },
    addLink: {
        color: theme.colors.branding.accent,
    },
}));
