import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppText, Chip, RangeSlider, SectionHeader, AppScreen, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';
import { RECIPE_KCAL_RANGE, RECIPE_KCAL_STEP } from '@/state/domains/recipe';

import ArrowRightIcon from '../../../../assets/icons/arrow-right.svg';
import {
    CUISINE_OPTIONS,
    DIET_OPTIONS,
    FILTER_INGREDIENTS,
    OPTION_EMOJI,
    PRODUCT_OPTIONS,
    RAIL_CATEGORY_EMOJI,
    RECIPE_RAIL_CATEGORIES,
} from '../recipe.constants';

import { useRecipesFilterScreen } from './useRecipesFilterScreen';

/** Фільтри — full-page filter picker (594:43425). */
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
        handleShow,
        handleAllIngredients,
    } = useRecipesFilterScreen();
    const [kcalMin, kcalMax] = RECIPE_KCAL_RANGE;

    const productsGroup = {
        group: 'products' as const,
        titleKey: 'recipes:filter.products-title',
        options: PRODUCT_OPTIONS,
    };
    const cuisinesGroup = {
        group: 'cuisines' as const,
        titleKey: 'recipes:filter.cuisines-title',
        options: CUISINE_OPTIONS,
    };
    const dietsGroup = { group: 'diets' as const, titleKey: 'recipes:filter.diets-title', options: DIET_OPTIONS };

    const renderOptionGroup = ({
        group,
        titleKey,
        options,
    }: typeof productsGroup | typeof cuisinesGroup | typeof dietsGroup) => (
        <View style={styles.section}>
            <SectionHeader title={t(titleKey)} />
            <View style={styles.chipsWrap}>
                {options.map(option => (
                    <Chip
                        key={option}
                        label={`${OPTION_EMOJI[option]} ${t(`recipes:options.${option}`)}`}
                        selected={filters[group].includes(option)}
                        onPress={() => handleToggle(group, option)}
                    />
                ))}
            </View>
        </View>
    );

    return (
        <AppScreen>
            <TopBar title={t('recipes:filter.title')} />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                        <SectionHeader title={t('recipes:filter.ingredients-title')} style={styles.sectionTitle} />
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t('recipes:filter.ingredients-all')}
                            hitSlop={8}
                            onPress={handleAllIngredients}
                            style={styles.allLink}
                        >
                            <AppText variant="bodyMediumReg">{t('recipes:filter.ingredients-all')}</AppText>
                            <ArrowRightIcon width={16} height={16} color={theme.colors.elements.primary} />
                        </Pressable>
                    </View>
                    <View style={styles.chipsWrap}>
                        {FILTER_INGREDIENTS.map(key => (
                            <Chip
                                key={key}
                                label={t(`recipes:ingredients.${key}`)}
                                selected={filters.ingredients.includes(key)}
                                onPress={() => handleToggle('ingredients', key)}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <SectionHeader title={t('recipes:filter.categories-title')} />
                    <View style={styles.chipsWrap}>
                        {RECIPE_RAIL_CATEGORIES.map(category => (
                            <Chip
                                key={category.key}
                                label={`${RAIL_CATEGORY_EMOJI[category.key]} ${t(`recipes:rail-categories.${category.key}`)}`}
                                selected={filters.categories.includes(category.key)}
                                onPress={() => handleToggle('categories', category.key)}
                            />
                        ))}
                    </View>
                </View>

                {renderOptionGroup(productsGroup)}

                <View style={[styles.section, styles.energySection]}>
                    <SectionHeader
                        title={t('recipes:filter.energy-title')}
                        subtitle={t('recipes:filter.energy-subtitle')}
                    />
                    <View style={styles.rangeLabels}>
                        <AppText variant="bodySmallReg">{filters.kcalRange[0]}</AppText>
                        <AppText variant="bodySmallReg">
                            {filters.kcalRange[1] >= kcalMax ? t('recipes:filter.energy-max') : filters.kcalRange[1]}
                        </AppText>
                    </View>
                    <RangeSlider
                        low={filters.kcalRange[0]}
                        high={filters.kcalRange[1]}
                        min={kcalMin}
                        max={kcalMax}
                        step={RECIPE_KCAL_STEP}
                        onChange={handleKcalChange}
                        accessibilityLabel={t('recipes:filter.energy-title')}
                    />
                </View>

                {renderOptionGroup(cuisinesGroup)}
                {renderOptionGroup(dietsGroup)}

                {/* The actions scroll with the content (594:43618). */}
                <View style={styles.footer}>
                    <AppButton
                        label={t('recipes:filter.show-results', { count: resultsCount })}
                        onPress={handleShow}
                        fullWidth
                    />
                    <AppButton
                        variant="secondary"
                        label={t('recipes:filter.reset', { count: filtersCount })}
                        onPress={handleReset}
                        fullWidth
                    />
                </View>
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    scroll: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[6],
        gap: theme.spacing[8],
    },
    section: {
        gap: theme.spacing[4],
        width: '100%',
    },
    // The energy block carries its own 12pt vertical inset (594:43529).
    energySection: {
        paddingVertical: theme.spacing[3],
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    sectionTitle: {
        width: 'auto',
        flexShrink: 1,
    },
    allLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    chipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[2],
        width: '100%',
    },
    rangeLabels: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    footer: {
        gap: theme.spacing[2],
        paddingTop: theme.spacing[6],
        width: '100%',
    },
}));
