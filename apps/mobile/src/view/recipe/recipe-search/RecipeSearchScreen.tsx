import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import {
    AppInput,
    AppScreen,
    AppText,
    CategoryTile,
    MacroChipsRow,
    SectionHeader,
    TopBar,
} from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import SearchIcon from '../../../../assets/icons/search.svg';
import SortIcon from '../../../../assets/icons/sort.svg';
import { RECIPE_RAIL_CATEGORIES } from '../recipe.constants';

import { useRecipeSearchScreen } from './useRecipeSearchScreen';

/** Пошук — categories grid, live results, and category mode (594:43242/43181/43293). */
export const RecipeSearchScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes']);
    const {
        categoryKey,
        categoryLabelKey,
        query,
        setQuery,
        ingredientResults,
        dishResults,
        handleClear,
        handleCategoryPress,
        handleFilterPress,
        handleResultPress,
        handleDishPress,
    } = useRecipeSearchScreen();

    const showCategories = !categoryKey && query.length === 0;
    const showQueryResults = !categoryKey && query.length > 0;

    const renderSectionTitle = (title: string, count: number) => (
        <View style={styles.sectionTitleRow}>
            <SectionHeader title={title} style={styles.sectionTitle} />
            <AppText variant="buttonTab" style={styles.countText}>
                {t('recipes:search.results-count', { count })}
            </AppText>
        </View>
    );

    const renderDishCard = (dish: (typeof dishResults)[number]) => (
        <Pressable
            key={dish.id}
            accessibilityRole="button"
            onPress={() => handleDishPress(dish.id)}
            style={styles.resultCard}
        >
            <View style={[styles.dishThumb, { backgroundColor: dish.thumbBg }]}>
                <AppText style={styles.dishEmoji}>{dish.emoji}</AppText>
            </View>
            <View style={styles.resultBody}>
                <AppText variant="bodySmallBold" numberOfLines={1}>
                    {dish.title}
                </AppText>
                <AppText variant="bodySmallReg" style={styles.mutedText}>
                    {t('recipes:list.kcal', { count: dish.kcal })}
                </AppText>
                <MacroChipsRow size="md" protein={dish.protein} fats={dish.fats} carbs={dish.carbs} />
            </View>
        </Pressable>
    );

    return (
        <AppScreen>
            {/* Category mode has no filter entry (594:43293). */}
            <TopBar
                title={categoryLabelKey ? t(categoryLabelKey) : t('recipes:search.title')}
                subtitle={categoryKey ? t('recipes:search.category-subtitle') : undefined}
                trailing={
                    !categoryKey ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t('recipes:list.filter-a11y')}
                            hitSlop={8}
                            onPress={handleFilterPress}
                            style={styles.filterButton}
                        >
                            <SortIcon width={24} height={24} color={theme.colors.elements.primary} />
                        </Pressable>
                    ) : undefined
                }
            />

            {!categoryKey ? (
                <View style={styles.searchField}>
                    <AppInput
                        placeholder={t('recipes:search.placeholder')}
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                        autoCorrect={false}
                        leftSlot={<SearchIcon width={20} height={20} color={theme.colors.elements.tertiary} />}
                        rightSlot={
                            query.length > 0 ? (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={t('recipes:search.clear-a11y')}
                                    hitSlop={8}
                                    onPress={handleClear}
                                >
                                    <Ionicons
                                        name="close-circle-outline"
                                        size={20}
                                        color={theme.colors.elements.tertiary}
                                    />
                                </Pressable>
                            ) : undefined
                        }
                    />
                </View>
            ) : null}

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {showCategories ? (
                    <View style={styles.section}>
                        <SectionHeader title={t('recipes:list.popular-categories')} />
                        <View style={styles.categoriesGrid}>
                            {RECIPE_RAIL_CATEGORIES.map(category => (
                                <CategoryTile
                                    key={category.key}
                                    image={category.image}
                                    label={t(`recipes:rail-categories.${category.key}`)}
                                    onPress={() => handleCategoryPress(category.key)}
                                    style={styles.categoryTile}
                                />
                            ))}
                        </View>
                    </View>
                ) : null}

                {showQueryResults ? (
                    <>
                        <View style={styles.section}>
                            {renderSectionTitle(t('recipes:search.ingredients-section'), ingredientResults.length)}
                            {ingredientResults.map(item => (
                                <Pressable
                                    key={item.id}
                                    accessibilityRole="button"
                                    onPress={() => handleResultPress(item.id)}
                                    style={styles.resultCard}
                                >
                                    <View style={[styles.resultBody, styles.ingredientBody]}>
                                        <AppText variant="bodySmallBold" numberOfLines={1}>
                                            {item.title}
                                        </AppText>
                                        <AppText variant="bodySmallReg" style={styles.mutedText}>
                                            {item.subtitle}
                                        </AppText>
                                        <MacroChipsRow
                                            size="md"
                                            protein={item.protein}
                                            fats={item.fats}
                                            carbs={item.carbs}
                                        />
                                    </View>
                                </Pressable>
                            ))}
                        </View>

                        <View style={styles.section}>
                            {renderSectionTitle(t('recipes:search.dishes-section'), dishResults.length)}
                            {dishResults.map(renderDishCard)}
                        </View>
                    </>
                ) : null}

                {categoryKey ? (
                    <View style={styles.section}>
                        <AppText variant="buttonTab" style={styles.countText}>
                            {t('recipes:search.results-count', { count: dishResults.length })}
                        </AppText>
                        {dishResults.map(renderDishCard)}
                    </View>
                ) : null}
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create((theme, rt) => ({
    filterButton: {
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    searchField: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[4],
    },
    scroll: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[10],
        gap: theme.spacing[4],
    },
    section: {
        gap: theme.spacing[2],
        width: '100%',
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        width: '100%',
    },
    sectionTitle: {
        width: 'auto',
        flexShrink: 1,
    },
    countText: {
        color: theme.colors.semantic.darkGrey,
    },
    mutedText: {
        color: theme.colors.semantic.darkGrey,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[2],
        width: '100%',
    },
    // A third of the content row even when the last row is short (594:43242).
    categoryTile: {
        flexGrow: 0,
        width: (rt.screen.width - theme.spacing[4] * 2 - theme.spacing[2] * 2) / 3,
    },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        width: '100%',
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightGrey,
        overflow: 'hidden',
    },
    resultBody: {
        flex: 1,
        gap: theme.spacing[1],
        paddingVertical: theme.spacing[2],
        paddingRight: theme.spacing[3],
    },
    // The ingredient row has no thumb — the card carries its own 16pt inset
    // (594:43189). Longhand edges only: shorthands lose to resultBody's
    // more specific paddingVertical/paddingRight regardless of merge order.
    ingredientBody: {
        paddingTop: theme.spacing[4],
        paddingBottom: theme.spacing[4],
        paddingLeft: theme.spacing[4],
        paddingRight: theme.spacing[4],
    },
    dishThumb: {
        alignSelf: 'stretch',
        width: 68,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dishEmoji: {
        fontSize: 30,
        lineHeight: 36,
    },
}));
