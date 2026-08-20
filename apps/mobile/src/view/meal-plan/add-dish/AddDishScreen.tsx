import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import {
    AppButton,
    AppScreen,
    AppText,
    CategoryTile,
    Chip,
    CircleBackButton,
    CountDot,
    ScreenActions,
    SegmentedTabs,
} from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import SearchIcon from '../../../../assets/icons/search.svg';
import SortIcon from '../../../../assets/icons/sort.svg';
import ShrugMascot from '../../../../assets/images/brand/mascot-shrug.svg';

import { PickRow } from './components';

import { useAddDishScreen } from './useAddDishScreen';

/** Додавання страв до прийому — the meal plan's dish picker (594:30106). */
export const AddDishScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['meal-plan', 'recipes']);
    const {
        mealKey,
        activeTab,
        tabs,
        handleTabChange,
        railCategory,
        railCategories,
        handleRailPress,
        appliedFilters,
        filtersCount,
        handleRemoveFilter,
        resultsCount,
        dishes,
        ingredients,
        isAdded,
        addedCount,
        handleToggleDish,
        handleSearchPress,
        handleFilterPress,
        handleIngredientPress,
        handleDone,
    } = useAddDishScreen();

    const showDishes = activeTab === 'dishes' || activeTab === 'own' || activeTab === 'favorites';
    const listEmpty = showDishes ? dishes.length === 0 : ingredients.length === 0;

    return (
        <AppScreen>
            <View style={styles.headerBar}>
                <View style={styles.headerSide}>
                    <CircleBackButton />
                </View>
                <AppText variant="bodyLargeBold" style={styles.headerTitle}>
                    {t(`meal-plan:meals.${mealKey}`)}
                </AppText>
                <View style={[styles.headerSide, styles.headerSideEnd]}>
                    <View style={styles.headerActions}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t('recipes:list.search-a11y')}
                            hitSlop={8}
                            onPress={handleSearchPress}
                        >
                            <SearchIcon width={24} height={24} color={theme.colors.elements.primary} />
                        </Pressable>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t('recipes:list.filter-a11y')}
                            hitSlop={8}
                            onPress={handleFilterPress}
                        >
                            <SortIcon width={24} height={24} color={theme.colors.elements.primary} />
                            {filtersCount > 0 ? <CountDot count={filtersCount} style={styles.filterBadge} /> : null}
                        </Pressable>
                    </View>
                </View>
            </View>

            <View style={styles.tabsRow}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContent}
                >
                    <SegmentedTabs
                        items={tabs.map(key => ({ key, label: t(`meal-plan:add-dish.tabs.${key}`) }))}
                        activeKey={activeTab}
                        onChange={handleTabChange}
                        contentSized
                    />
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {appliedFilters.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.chipsViewport}
                        contentContainerStyle={styles.chipsRow}
                    >
                        {appliedFilters.map(filter => (
                            <Chip
                                key={filter.key}
                                size="sm"
                                label={filter.label}
                                onRemove={() => handleRemoveFilter(filter)}
                            />
                        ))}
                    </ScrollView>
                ) : activeTab === 'dishes' ? (
                    <View style={styles.section}>
                        <AppText variant="bodyLargeBold" accessibilityRole="header">
                            {t('recipes:list.popular-categories')}
                        </AppText>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.railViewport}
                            contentContainerStyle={styles.rail}
                        >
                            {railCategories.map(category => (
                                <CategoryTile
                                    key={category.key}
                                    image={category.image}
                                    label={t(`recipes:rail-categories.${category.key}`)}
                                    selected={railCategory === category.key}
                                    onPress={() => handleRailPress(category.key)}
                                />
                            ))}
                        </ScrollView>
                    </View>
                ) : null}

                <AppText variant="buttonTab" style={styles.countText}>
                    {t('recipes:search.results-count', { count: listEmpty ? 0 : resultsCount })}
                </AppText>

                {listEmpty ? (
                    <View style={styles.notFound}>
                        <ShrugMascot width={200} height={200} />
                        <View style={styles.notFoundMessage}>
                            <AppText variant="bodyLargeBold">{t('meal-plan:add-dish.not-found-title')}</AppText>
                            <AppText variant="bodyLargeReg" style={styles.mutedText}>
                                {t('meal-plan:add-dish.not-found-subtitle')}
                            </AppText>
                        </View>
                    </View>
                ) : showDishes ? (
                    dishes.map(dish => (
                        <PickRow
                            key={dish.id}
                            title={dish.title}
                            subtitle={t('recipes:list.kcal', { count: dish.kcal })}
                            emoji={dish.emoji}
                            thumbBg={dish.thumbBg}
                            protein={dish.protein}
                            fats={dish.fats}
                            carbs={dish.carbs}
                            added={isAdded(dish.id)}
                            onAdd={() => handleToggleDish(dish)}
                        />
                    ))
                ) : (
                    ingredients.map(item => (
                        <PickRow
                            key={item.id}
                            title={item.title}
                            subtitle={item.subtitle}
                            protein={item.protein}
                            fats={item.fats}
                            carbs={item.carbs}
                            onAdd={handleIngredientPress}
                        />
                    ))
                )}
            </ScrollView>

            {addedCount > 0 ? (
                <ScreenActions>
                    <AppButton
                        label={t('meal-plan:add-dish.added-count', { count: addedCount })}
                        onPress={handleDone}
                        fullWidth
                    />
                </ScreenActions>
            ) : null}
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
    // Equal flanks keep the title on the screen's center line (594:30277).
    headerSide: {
        width: 90,
        flexDirection: 'row',
    },
    headerSideEnd: {
        justifyContent: 'flex-end',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4],
        minHeight: 44,
        paddingHorizontal: theme.spacing[2],
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightGrey,
        paddingVertical: theme.spacing[2],
    },
    // The dot's top-right corner sits flush with the icon's (594:30640).
    filterBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    tabsRow: {
        paddingBottom: theme.spacing[2],
    },
    tabsContent: {
        paddingHorizontal: theme.spacing[4],
    },
    scroll: {
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[2],
        paddingBottom: theme.spacing[10],
        gap: theme.spacing[2],
    },
    chipsViewport: {
        marginHorizontal: -theme.spacing[4],
    },
    chipsRow: {
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
    },
    section: {
        gap: theme.spacing[2],
        width: '100%',
    },
    railViewport: {
        marginHorizontal: -theme.spacing[4],
    },
    rail: {
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
    },
    countText: {
        color: theme.colors.semantic.darkGrey,
        // 16 below the rail/chips — the list keeps the scroll's 8 (594:30106).
        marginTop: theme.spacing[2],
    },
    notFound: {
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingTop: theme.spacing[2],
        width: '100%',
    },
    notFoundMessage: {
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    mutedText: {
        color: theme.colors.semantic.darkGrey,
    },
}));
