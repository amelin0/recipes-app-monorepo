import React, { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import {
    AppButton,
    AppText,
    CircleBackButton,
    CircleIconButton,
    PageDots,
    SegmentedControl,
} from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import ChefsHatIcon from '../../../../assets/icons/chefs-hat.svg';
import CutleryIcon from '../../../../assets/icons/cutlery.svg';
import EditIcon from '../../../../assets/icons/edit.svg';
import ExportIcon from '../../../../assets/icons/export.svg';
import HeartIcon from '../../../../assets/icons/heart.svg';
import { TimeTag } from '../components';

import { IngredientRow, MealSummaryRow, StepCard } from './components';
import { useMealDetailsScreen } from './useMealDetailsScreen';

const HERO_HEIGHT = 308;
const SHEET_OVERLAP = 44;

export const MealDetailsScreen = () => {
    const { theme } = useUnistyles();
    const insets = useSafeAreaInsets();
    const { t } = useAppTranslation(['recipes']);
    const [carouselWidth, setCarouselWidth] = useState(0);
    const {
        meal,
        activeTab,
        setActiveTab,
        isFavorite,
        stepIndex,
        handleStepScroll,
        handleToggleFavorite,
        handleEdit,
        handleShare,
        handleAddToShoppingList,
        handleAddToRation,
        handlePortionsPress,
        handleCookPress,
    } = useMealDetailsScreen();

    return (
        <View style={styles.screen}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <Image source={meal.image} style={styles.hero} resizeMode="cover" />

                <View style={styles.sheet}>
                    <View style={styles.titleBlock}>
                        <AppText variant="titleLarge">{meal.title}</AppText>
                        <AppText variant="bodyLargeReg" color="tertiary">
                            {meal.cuisine}
                        </AppText>
                        <TimeTag label={t('recipes:list.minutes', { count: meal.minutes })} />
                    </View>

                    <MealSummaryRow kcal={meal.kcal} protein={meal.protein} fats={meal.fats} carbs={meal.carbs} />

                    <SegmentedControl
                        items={[
                            { key: 'ingredients', label: t('recipes:details.tabs.ingredients') },
                            { key: 'method', label: t('recipes:details.tabs.method') },
                        ]}
                        activeKey={activeTab}
                        onChange={setActiveTab}
                    />

                    {activeTab === 'ingredients' ? (
                        <View style={styles.tabContent}>
                            {meal.ingredients.map(ingredient => (
                                <IngredientRow key={ingredient.id} ingredient={ingredient} />
                            ))}
                            <AppButton
                                variant="secondary"
                                size="md"
                                fullWidth
                                label={t('recipes:details.add-to-shopping-list')}
                                onPress={handleAddToShoppingList}
                            />
                        </View>
                    ) : (
                        <View
                            style={styles.tabContent}
                            onLayout={event => setCarouselWidth(event.nativeEvent.layout.width)}
                        >
                            {carouselWidth > 0 ? (
                                <ScrollView
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    onMomentumScrollEnd={event => handleStepScroll(event, carouselWidth)}
                                >
                                    {meal.steps.map(step => (
                                        <StepCard key={step.id} step={step} width={carouselWidth} />
                                    ))}
                                </ScrollView>
                            ) : null}
                            <PageDots count={meal.steps.length} activeIndex={stepIndex} />
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={[styles.header, { top: insets.top + theme.spacing[2] }]}>
                <CircleBackButton />
                <View style={styles.headerActions}>
                    <CircleIconButton
                        accessibilityLabel={t('recipes:details.favorite-a11y')}
                        onPress={handleToggleFavorite}
                    >
                        <HeartIcon
                            width={24}
                            height={24}
                            color={isFavorite ? theme.colors.semantic.negative : theme.colors.elements.primary}
                        />
                    </CircleIconButton>
                    <CircleIconButton accessibilityLabel={t('recipes:details.edit-a11y')} onPress={handleEdit}>
                        <EditIcon width={24} height={24} color={theme.colors.elements.primary} />
                    </CircleIconButton>
                    <CircleIconButton accessibilityLabel={t('recipes:details.share-a11y')} onPress={handleShare}>
                        <ExportIcon width={24} height={24} color={theme.colors.elements.primary} />
                    </CircleIconButton>
                </View>
            </View>

            <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing[2] }]}>
                <CircleIconButton
                    size={52}
                    accessibilityLabel={t('recipes:details.portions-a11y')}
                    onPress={handlePortionsPress}
                >
                    <CutleryIcon width={24} height={24} color={theme.colors.elements.primary} />
                </CircleIconButton>
                <CircleIconButton
                    size={52}
                    accessibilityLabel={t('recipes:details.cook-a11y')}
                    onPress={handleCookPress}
                >
                    <ChefsHatIcon width={24} height={24} color={theme.colors.elements.primary} />
                </CircleIconButton>
                <AppButton
                    label={t('recipes:details.add-to-ration')}
                    onPress={handleAddToRation}
                    style={styles.footerButton}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    screen: {
        flex: 1,
        backgroundColor: theme.colors.semantic.white,
    },
    scroll: {
        paddingBottom: 140,
    },
    hero: {
        width: '100%',
        height: HERO_HEIGHT,
    },
    sheet: {
        marginTop: -SHEET_OVERLAP,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        backgroundColor: theme.colors.semantic.white,
        padding: theme.spacing[4],
        gap: theme.spacing[4],
    },
    titleBlock: {
        gap: theme.spacing[1],
    },
    tabContent: {
        gap: theme.spacing[2],
        width: '100%',
    },
    header: {
        position: 'absolute',
        left: theme.spacing[4],
        right: theme.spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[2],
        backgroundColor: theme.colors.semantic.white,
    },
    footerButton: {
        flex: 1,
    },
}));
