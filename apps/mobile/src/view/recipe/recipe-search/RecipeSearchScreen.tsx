import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppInput, AppScreen, AppText, CircleBackButton, SectionHeader } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import SearchIcon from '../../../../assets/icons/search.svg';
import SortIcon from '../../../../assets/icons/sort.svg';
import { CategoryTile, MacroChipsRow } from '../components';
import { RECIPE_CATEGORIES } from '../recipe.constants';

import { useRecipeSearchScreen } from './useRecipeSearchScreen';

export const RecipeSearchScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes']);
    const {
        categoryKey,
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

    return (
        <AppScreen>
            <View style={styles.headerBar}>
                <CircleBackButton />
                <View style={styles.headerCenter}>
                    <AppText variant="bodyLargeBold">
                        {categoryKey ? t(`recipes:categories.${categoryKey}`) : t('recipes:search.title')}
                    </AppText>
                    {categoryKey ? (
                        <AppText variant="bodySmallReg" color="tertiary">
                            {t('recipes:search.category-subtitle')}
                        </AppText>
                    ) : null}
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('recipes:list.filter-a11y')}
                    hitSlop={8}
                    onPress={handleFilterPress}
                    style={styles.filterButton}
                >
                    <SortIcon width={24} height={24} color={theme.colors.elements.primary} />
                </Pressable>
            </View>

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
                            {RECIPE_CATEGORIES.map(category => (
                                <CategoryTile
                                    key={category.key}
                                    image={category.image}
                                    label={t(`recipes:categories.${category.key}`)}
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
                            <View style={styles.sectionTitleRow}>
                                <SectionHeader title={t('recipes:search.ingredients-section')} />
                                <AppText variant="bodySmallReg" color="tertiary">
                                    {t('recipes:search.results-count', { count: ingredientResults.length })}
                                </AppText>
                            </View>
                            {ingredientResults.map(item => (
                                <Pressable
                                    key={item.id}
                                    accessibilityRole="button"
                                    onPress={() => handleResultPress(item.id)}
                                    style={styles.resultCard}
                                >
                                    <View style={styles.resultBody}>
                                        <AppText variant="bodyMediumBold">{item.title}</AppText>
                                        <AppText variant="bodySmallReg" color="tertiary">
                                            {item.subtitle}
                                        </AppText>
                                        <MacroChipsRow protein={item.protein} fats={item.fats} carbs={item.carbs} />
                                    </View>
                                </Pressable>
                            ))}
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionTitleRow}>
                                <SectionHeader title={t('recipes:search.dishes-section')} />
                                <AppText variant="bodySmallReg" color="tertiary">
                                    {t('recipes:search.results-count', { count: dishResults.length })}
                                </AppText>
                            </View>
                            {dishResults.map(dish => (
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
                                        <AppText variant="bodyMediumBold">{dish.title}</AppText>
                                        <AppText variant="bodySmallReg" color="tertiary">
                                            {t('recipes:list.kcal', { count: dish.kcal })}
                                        </AppText>
                                        <MacroChipsRow protein={dish.protein} fats={dish.fats} carbs={dish.carbs} />
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    </>
                ) : null}

                {categoryKey ? (
                    <View style={styles.section}>
                        <AppText variant="bodySmallReg" color="tertiary">
                            {t('recipes:search.results-count', { count: dishResults.length })}
                        </AppText>
                        {dishResults.map(dish => (
                            <Pressable
                                key={dish.id}
                                accessibilityRole="button"
                                onPress={() => handleDishPress(dish.id)}
                                style={styles.resultCard}
                            >
                                <View style={[styles.dishThumbLarge, { backgroundColor: dish.thumbBg }]}>
                                    <AppText style={styles.dishEmoji}>{dish.emoji}</AppText>
                                </View>
                                <View style={styles.resultBody}>
                                    <AppText variant="bodyMediumBold">{dish.title}</AppText>
                                    <AppText variant="bodySmallReg" color="tertiary">
                                        {t('recipes:list.kcal', { count: dish.kcal })}
                                    </AppText>
                                    <MacroChipsRow protein={dish.protein} fats={dish.fats} carbs={dish.carbs} />
                                </View>
                            </Pressable>
                        ))}
                    </View>
                ) : null}
            </ScrollView>
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
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
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
        gap: theme.spacing[6],
    },
    section: {
        gap: theme.spacing[2],
        width: '100%',
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        justifyContent: 'space-between',
        width: '100%',
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[2],
        width: '100%',
    },
    categoryTile: {
        flexGrow: 1,
        flexBasis: '30%',
        minWidth: 100,
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
        padding: theme.spacing[3],
    },
    dishThumb: {
        alignSelf: 'stretch',
        width: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dishThumbLarge: {
        alignSelf: 'stretch',
        width: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dishEmoji: {
        fontSize: 24,
        lineHeight: 32,
    },
}));
