import React from 'react';
import { Image, ScrollView, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import {
    AppButton,
    AppText,
    CircleBackButton,
    CircleIconButton,
    NutritionSummaryRow,
    SegmentedControl,
    Tag,
} from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import AddIcon from '../../../../assets/icons/add.svg';
import CutleryIcon from '../../../../assets/icons/cutlery.svg';
import EditIcon from '../../../../assets/icons/edit.svg';
import ExportIcon from '../../../../assets/icons/export.svg';
import HeartIcon from '../../../../assets/icons/heart.svg';

import { IngredientRow, MethodCard } from './components';
import { useMealDetailsScreen } from './useMealDetailsScreen';

const HERO_HEIGHT = 308;
const SHEET_OVERLAP = 44;

export const MealDetailsScreen = () => {
    const { theme } = useUnistyles();
    const insets = useSafeAreaInsets();
    const { t } = useAppTranslation(['recipes']);
    const {
        meal,
        isPlanMode,
        activeTab,
        setActiveTab,
        isFavorite,
        handleToggleFavorite,
        handleEdit,
        handleShare,
        handleAddToPlan,
        handleLogMeal,
    } = useMealDetailsScreen();

    return (
        <View style={styles.screen}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <Image source={meal.image} style={styles.hero} resizeMode="cover" />

                <View style={styles.sheet}>
                    <View style={styles.titleRow}>
                        <View style={styles.titleBlock}>
                            <AppText variant="titleLarge">{meal.title}</AppText>
                            <AppText variant="bodyLargeReg" color="tertiary">
                                {meal.cuisine}
                            </AppText>
                        </View>
                        <Tag label={t('recipes:list.minutes', { count: meal.minutes })} tone="negative" />
                    </View>

                    <NutritionSummaryRow
                        calories={meal.kcal.toLocaleString('en-US')}
                        macros={{ protein: meal.protein, fats: meal.fats, carbs: meal.carbs }}
                    />

                    <SegmentedControl
                        items={[
                            { key: 'ingredients', label: t('recipes:details.tabs.ingredients') },
                            { key: 'method', label: t('recipes:details.tabs.method') },
                        ]}
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        equalWidths
                    />

                    {activeTab === 'ingredients' ? (
                        <View style={styles.tabContent}>
                            <AppText variant="bodyLargeBold" accessibilityRole="header">
                                {t('recipes:details.tabs.ingredients')}
                            </AppText>
                            {meal.ingredients.map(ingredient => (
                                <IngredientRow key={ingredient.id} ingredient={ingredient} />
                            ))}
                        </View>
                    ) : (
                        <MethodCard
                            ingredients={meal.ingredients.map(ingredient => ingredient.name)}
                            time={t('recipes:list.minutes', { count: meal.minutes })}
                            steps={meal.steps}
                        />
                    )}

                    {/* CTA скролиться разом зі змістом (984:58839). */}
                    {isPlanMode ? (
                        <AppButton
                            fullWidth
                            label={t('recipes:details.add-to-ration')}
                            onPress={handleAddToPlan}
                            leftSlot={<AddIcon width={24} height={24} color={theme.colors.semantic.white} />}
                        />
                    ) : (
                        <AppButton
                            fullWidth
                            label={t('recipes:details.log-meal')}
                            onPress={handleLogMeal}
                            leftSlot={<CutleryIcon width={24} height={24} color={theme.colors.semantic.white} />}
                        />
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
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    screen: {
        flex: 1,
        backgroundColor: theme.colors.semantic.white,
    },
    scroll: {
        // Разом із нижнім падінгом «полотна» дає 40 під CTA (984:58841).
        paddingBottom: theme.spacing[6],
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
    titleRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    titleBlock: {
        flex: 1,
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
}));
