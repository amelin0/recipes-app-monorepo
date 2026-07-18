import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppText, Chip, RangeSlider, SectionHeader } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { CategoryTile } from '../components';
import { DIET_OPTIONS, INGREDIENT_OPTIONS, MEAL_OPTIONS, METHOD_OPTIONS, RECIPE_CATEGORIES } from '../recipe.constants';

import { useRecipesFilterScreen } from './useRecipesFilterScreen';

export const RecipesFilterScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes', 'common']);
    const {
        filters,
        filtersCount,
        resultsCount,
        handleToggle,
        handleKcalChange,
        handleReset,
        handleClose,
        handleShow,
    } = useRecipesFilterScreen();

    const chipGroups = [
        { group: 'meals' as const, titleKey: 'recipes:filter.meals-title', options: MEAL_OPTIONS },
        { group: 'methods' as const, titleKey: 'recipes:filter.methods-title', options: METHOD_OPTIONS },
        { group: 'diets' as const, titleKey: 'recipes:filter.diets-title', options: DIET_OPTIONS },
        { group: 'ingredients' as const, titleKey: 'recipes:filter.ingredients-title', options: INGREDIENT_OPTIONS },
    ];

    return (
        <View style={styles.sheet}>
            <View style={styles.headerBar}>
                <AppText variant="titleMedium" style={styles.headerTitle}>
                    {t('recipes:filter.title')}
                </AppText>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('common:actions.close')}
                    hitSlop={8}
                    onPress={handleClose}
                    style={styles.closeButton}
                >
                    <Ionicons name="close" size={24} color={theme.colors.elements.primary} />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <SectionHeader title={t('recipes:list.popular-categories')} />
                    <View style={styles.categoriesGrid}>
                        {RECIPE_CATEGORIES.map(category => (
                            <CategoryTile
                                key={category.key}
                                image={category.image}
                                label={t(`recipes:categories.${category.key}`)}
                                selected={filters.categories.includes(category.key)}
                                onPress={() => handleToggle('categories', category.key)}
                                style={styles.categoryTile}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <SectionHeader
                        title={t('recipes:filter.energy-title')}
                        subtitle={t('recipes:filter.energy-subtitle')}
                    />
                    <View style={styles.rangeLabels}>
                        <AppText variant="bodySmallReg">{filters.kcalRange[0]}</AppText>
                        <AppText variant="bodySmallReg">
                            {filters.kcalRange[1] >= 800 ? t('recipes:filter.energy-max') : filters.kcalRange[1]}
                        </AppText>
                    </View>
                    <RangeSlider
                        low={filters.kcalRange[0]}
                        high={filters.kcalRange[1]}
                        min={0}
                        max={800}
                        step={10}
                        onChange={handleKcalChange}
                        accessibilityLabel={t('recipes:filter.energy-title')}
                    />
                </View>

                {chipGroups.map(group => (
                    <View key={group.group} style={styles.section}>
                        <SectionHeader title={t(group.titleKey)} />
                        <View style={styles.chipsWrap}>
                            {group.options.map(option => (
                                <Chip
                                    key={option}
                                    label={t(`recipes:options.${option}`)}
                                    selected={filters[group.group].includes(option)}
                                    onPress={() => handleToggle(group.group, option)}
                                />
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <AppButton
                    variant="secondary"
                    label={t('recipes:filter.reset', { count: filtersCount })}
                    onPress={handleReset}
                    fullWidth
                />
                <AppButton
                    label={t('recipes:filter.show-results', { count: resultsCount })}
                    onPress={handleShow}
                    fullWidth
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    sheet: {
        flex: 1,
        backgroundColor: theme.colors.background.screen,
        borderTopLeftRadius: theme.radius.xl,
        borderTopRightRadius: theme.radius.xl,
        ...theme.shadow.sheet,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingTop: theme.spacing[6],
        paddingBottom: theme.spacing[4],
        paddingHorizontal: theme.spacing[4],
    },
    headerTitle: {
        flex: 1,
    },
    closeButton: {
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    scroll: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[10],
        gap: theme.spacing[8],
    },
    section: {
        gap: theme.spacing[2],
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
    rangeLabels: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    chipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[2],
        width: '100%',
    },
    footer: {
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        paddingBottom: theme.spacing[10],
    },
}));
