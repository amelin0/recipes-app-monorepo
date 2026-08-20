import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppScreen, AppText, CategoryTile, Chip, CountDot, SectionHeader, SegmentedTabs } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import GridViewIcon from '../../../../assets/icons/grid-view.svg';
import ListViewIcon from '../../../../assets/icons/list-view.svg';
import SearchIcon from '../../../../assets/icons/search.svg';
import SortIcon from '../../../../assets/icons/sort.svg';
import { RecipeCard } from '../components';
import { RECIPE_RAIL_CATEGORIES } from '../recipe.constants';

import { AddRecipeTile } from './components';

import { useRecipesListScreen } from './useRecipesListScreen';

export const RecipesListScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes']);
    const {
        activeTab,
        setActiveTab,
        viewMode,
        setViewMode,
        recipes,
        sectionTitle,
        appliedFilters,
        filtersCount,
        handleSearchPress,
        handleFilterPress,
        handleCategoryPress,
        handleRecipePress,
        handleToggleFavorite,
        handleRemoveFilter,
        handleAddRecipePress,
    } = useRecipesListScreen();

    return (
        <AppScreen>
            <View style={styles.headerBar}>
                <AppText variant="titleMedium" style={styles.headerTitle}>
                    {t('recipes:list.title')}
                </AppText>
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

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <SegmentedTabs
                    items={[
                        { key: 'all', label: t('recipes:list.tabs.all') },
                        { key: 'favorites', label: t('recipes:list.tabs.favorites') },
                        { key: 'own', label: t('recipes:list.tabs.own') },
                    ]}
                    activeKey={activeTab}
                    onChange={setActiveTab}
                />

                {appliedFilters.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
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
                ) : null}

                {/* Applied filters take the rail's place (594:44282). */}
                {activeTab === 'all' && appliedFilters.length === 0 ? (
                    <View style={styles.section}>
                        <SectionHeader title={t('recipes:list.popular-categories')} />
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoriesRail}
                        >
                            {RECIPE_RAIL_CATEGORIES.map(category => (
                                <CategoryTile
                                    key={category.key}
                                    image={category.image}
                                    label={t(`recipes:rail-categories.${category.key}`)}
                                    onPress={() => handleCategoryPress(category.key)}
                                />
                            ))}
                        </ScrollView>
                    </View>
                ) : null}

                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <SectionHeader title={sectionTitle} style={styles.sectionHeaderTitle} />
                        <View style={styles.viewToggle}>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={t('recipes:list.grid-a11y')}
                                accessibilityState={{ selected: viewMode === 'grid' }}
                                onPress={() => setViewMode('grid')}
                                style={styles.viewToggleButton(viewMode === 'grid')}
                            >
                                <GridViewIcon width={16} height={16} color={theme.colors.elements.primary} />
                            </Pressable>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={t('recipes:list.list-a11y')}
                                accessibilityState={{ selected: viewMode === 'list' }}
                                onPress={() => setViewMode('list')}
                                style={styles.viewToggleButton(viewMode === 'list')}
                            >
                                <ListViewIcon width={16} height={16} color={theme.colors.elements.primary} />
                            </Pressable>
                        </View>
                    </View>

                    {recipes.length > 0 || activeTab === 'own' ? (
                        <View style={styles.grid}>
                            {recipes.map(recipe => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    variant={viewMode}
                                    onPress={() => handleRecipePress(recipe.id)}
                                    onToggleFavorite={() => handleToggleFavorite(recipe.id)}
                                />
                            ))}
                            {activeTab === 'own' ? (
                                <AddRecipeTile fullWidth={viewMode === 'list'} onPress={handleAddRecipePress} />
                            ) : null}
                        </View>
                    ) : (
                        <AppText variant="bodyMediumReg" color="tertiary">
                            {t('recipes:list.empty')}
                        </AppText>
                    )}
                </View>
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        minHeight: 72,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
    },
    headerTitle: {
        flex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[6],
        minHeight: 44,
        paddingHorizontal: theme.spacing[2],
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightGrey,
        paddingVertical: theme.spacing[2],
    },
    // The dot's top-right corner sits flush with the icon's (594:43242).
    filterBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    scroll: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: 120,
        gap: theme.spacing[4],
    },
    chipsRow: {
        gap: theme.spacing[2],
    },
    section: {
        gap: theme.spacing[2],
        width: '100%',
    },
    categoriesRail: {
        gap: theme.spacing[2],
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        // The recipes section runs a 12pt header gap; the rail keeps the section's 8.
        marginBottom: theme.spacing[1],
    },
    sectionHeaderTitle: {
        flex: 1,
    },
    viewToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
        padding: theme.spacing[1],
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    viewToggleButton: (active: boolean) => ({
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: active ? theme.colors.active.tertiary : 'transparent',
    }),
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[3],
        width: '100%',
    },
}));
