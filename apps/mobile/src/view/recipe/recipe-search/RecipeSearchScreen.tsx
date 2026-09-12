import React from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { Product } from '@/data';
import {
    AppInput,
    AppScreen,
    AppText,
    CategoryTile,
    MacroChipsRow,
    PickRow,
    SectionHeader,
    TopBar,
} from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import SearchIcon from '../../../../assets/icons/search.svg';
import SortIcon from '../../../../assets/icons/sort.svg';
import { RAIL_CATEGORY_IMAGES, RECIPE_PLACEHOLDER_IMAGE } from '../recipe.constants';

import { useRecipeSearchScreen } from './useRecipeSearchScreen';

/** Тумб страви заливається дизайновим градієнтом (594:42913). */
const GRADIENT = { x1: '-0.056', y1: '0.055', x2: '1.056', y2: '0.945' };

/** Nothing in the payload says what a dish looks like, so one tile for all. */
const DISH_FALLBACK_EMOJI = '🍽️';

/**
 * «100 г · 43 ккал» — the per-100g figure every product carries, since the
 * serving one is optional and absent for anything only ever weighed.
 */
const productSubtitle = (product: Product) => `100 г · ${Math.round(product.caloriesPer100g)} ккал`;

/** Пошук — categories grid, live results, and category mode (594:43242/43181/43293). */
export const RecipeSearchScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes']);
    const {
        categoryKey,
        categoryLabel,
        categories,
        query,
        debouncedQuery,
        setQuery,
        ingredientResults,
        dishResults,
        isPicker,
        isAdded,
        handleToggleSearchDish,
        handleClear,
        handleCategoryPress,
        handleFilterPress,
        handleResultPress,
        handleDishPress,
    } = useRecipeSearchScreen();

    // Сітка тримається, поки відкладений запит порожній (594:43001).
    const showCategories = !categoryKey && debouncedQuery.length === 0;
    const showQueryResults = !categoryKey && debouncedQuery.length > 0;

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
            <View style={styles.dishThumb}>
                {dish.photoUrl ? (
                    <Image source={{ uri: dish.photoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                    <>
                        <Svg style={StyleSheet.absoluteFill}>
                            <Defs>
                                <LinearGradient id="searchThumb" {...GRADIENT}>
                                    <Stop offset="0" stopColor={theme.colors.gradient.dishFrom} />
                                    <Stop offset="1" stopColor={theme.colors.gradient.dishTo} />
                                </LinearGradient>
                            </Defs>
                            <Rect x="0" y="0" width="100%" height="100%" fill="url(#searchThumb)" />
                        </Svg>
                        <AppText style={styles.dishEmoji}>{DISH_FALLBACK_EMOJI}</AppText>
                    </>
                )}
            </View>
            <View style={styles.resultBody}>
                <AppText variant="bodySmallBold" numberOfLines={1}>
                    {dish.title}
                </AppText>
                <AppText variant="bodySmallReg" style={styles.mutedText}>
                    {t('recipes:list.kcal', { count: Math.round(dish.perServing.calories) })}
                </AppText>
                <MacroChipsRow
                    size="md"
                    protein={Math.round(dish.perServing.proteinG)}
                    fats={Math.round(dish.perServing.fatsG)}
                    carbs={Math.round(dish.perServing.carbsG)}
                />
            </View>
        </Pressable>
    );

    return (
        <AppScreen>
            {/* Category mode has no filter entry (594:43293). */}
            <TopBar
                title={categoryLabel ?? t('recipes:search.title')}
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
                // Результати довші за екран — інсет під клавіатуру, щоб нижні
                // картки не лишились під нею.
                automaticallyAdjustKeyboardInsets
            >
                {showCategories ? (
                    <View style={styles.section}>
                        <SectionHeader title={t('recipes:list.popular-categories')} />
                        <View style={styles.categoriesGrid}>
                            {categories.map(category => (
                                <CategoryTile
                                    key={category.id}
                                    image={RAIL_CATEGORY_IMAGES[category.slug] ?? RECIPE_PLACEHOLDER_IMAGE}
                                    label={category.name}
                                    onPress={() => handleCategoryPress(category.id)}
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
                            {isPicker
                                ? ingredientResults.map(item => (
                                      <PickRow
                                          key={item.id}
                                          title={item.name}
                                          subtitle={productSubtitle(item)}
                                          protein={Math.round(item.proteinPer100g)}
                                          fats={Math.round(item.fatsPer100g)}
                                          carbs={Math.round(item.carbsPer100g)}
                                          onAdd={() => handleResultPress(item.id)}
                                      />
                                  ))
                                : ingredientResults.map(item => (
                                      <Pressable
                                          key={item.id}
                                          accessibilityRole="button"
                                          onPress={() => handleResultPress(item.id)}
                                          style={styles.resultCard}
                                      >
                                          <View style={[styles.resultBody, styles.ingredientBody]}>
                                              <AppText variant="bodySmallBold" numberOfLines={1}>
                                                  {item.name}
                                              </AppText>
                                              <AppText variant="bodySmallReg" style={styles.mutedText}>
                                                  {productSubtitle(item)}
                                              </AppText>
                                              <MacroChipsRow
                                                  size="md"
                                                  protein={Math.round(item.proteinPer100g)}
                                                  fats={Math.round(item.fatsPer100g)}
                                                  carbs={Math.round(item.carbsPer100g)}
                                              />
                                          </View>
                                      </Pressable>
                                  ))}
                        </View>

                        <View style={styles.section}>
                            {renderSectionTitle(t('recipes:search.dishes-section'), dishResults.length)}
                            {isPicker
                                ? dishResults.map(dish => (
                                      <PickRow
                                          key={dish.id}
                                          title={dish.title}
                                          subtitle={t('recipes:list.kcal', {
                                              count: Math.round(dish.perServing.calories),
                                          })}
                                          emoji={DISH_FALLBACK_EMOJI}
                                          protein={Math.round(dish.perServing.proteinG)}
                                          fats={Math.round(dish.perServing.fatsG)}
                                          carbs={Math.round(dish.perServing.carbsG)}
                                          added={isAdded(dish.id)}
                                          onAdd={() => handleToggleSearchDish(dish)}
                                          onPress={() => handleDishPress(dish.id)}
                                      />
                                  ))
                                : dishResults.map(renderDishCard)}
                        </View>
                    </>
                ) : null}

                {categoryKey ? (
                    <View style={styles.section}>
                        <AppText variant="buttonTab" style={styles.countText}>
                            {t('recipes:search.results-count', { count: dishResults.length })}
                        </AppText>
                        {isPicker
                            ? dishResults.map(dish => (
                                  <PickRow
                                      key={dish.id}
                                      title={dish.title}
                                      subtitle={t('recipes:list.kcal', {
                                          count: Math.round(dish.perServing.calories),
                                      })}
                                      emoji={DISH_FALLBACK_EMOJI}
                                      protein={Math.round(dish.perServing.proteinG)}
                                      fats={Math.round(dish.perServing.fatsG)}
                                      carbs={Math.round(dish.perServing.carbsG)}
                                      added={isAdded(dish.id)}
                                      onAdd={() => handleToggleSearchDish(dish)}
                                      onPress={() => handleDishPress(dish.id)}
                                  />
                              ))
                            : dishResults.map(renderDishCard)}
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
