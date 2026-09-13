import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { Reference } from '@/data';
import {
    AppButton,
    AppScreen,
    AppText,
    Chip,
    QueryState,
    RangeSlider,
    SectionHeader,
    TopBar,
} from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';
import { RECIPE_KCAL_RANGE, RECIPE_KCAL_STEP, type RecipeFilterGroup } from '@/state/domains/recipe';

import ArrowRightIcon from '../../../../assets/icons/arrow-right.svg';

import { useRecipesFilterScreen } from './useRecipesFilterScreen';

/** The emoji travels with the option; the applied chips drop it (594:44769). */
const optionLabel = (option: Reference) => (option.emoji ? `${option.emoji} ${option.name}` : option.name);

/** Фільтри — full-page filter picker (594:43425). */
export const RecipesFilterScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes', 'common']);
    const {
        filters,
        options,
        isLoading,
        isError,
        handleRetry,
        filtersCount,
        resultsCount,
        handleToggle,
        handleKcalChange,
        handleReset,
        handleShow,
        handleAllIngredients,
    } = useRecipesFilterScreen();
    const [kcalMin, kcalMax] = RECIPE_KCAL_RANGE;

    const renderOptionGroup = (group: RecipeFilterGroup, titleKey: string, items: Reference[]) => (
        <View style={styles.section}>
            <SectionHeader title={t(titleKey)} />
            <View style={styles.chipsWrap}>
                {items.map(option => (
                    <Chip
                        key={option.id}
                        label={optionLabel(option)}
                        selected={filters[group].includes(option.id)}
                        onPress={() => handleToggle(group, option.id)}
                    />
                ))}
            </View>
        </View>
    );

    return (
        <AppScreen>
            <TopBar title={t('recipes:filter.title')} />

            <QueryState isLoading={isLoading} isError={isError} onRetry={handleRetry}>
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
                            {(options?.quickProducts ?? []).map(product => (
                                <Chip
                                    key={product.id}
                                    label={product.name}
                                    selected={filters.products.includes(product.id)}
                                    onPress={() => handleToggle('products', product.id)}
                                />
                            ))}
                        </View>
                    </View>

                    {renderOptionGroup('categories', 'recipes:filter.categories-title', options?.categories ?? [])}
                    {renderOptionGroup('productGroups', 'recipes:filter.products-title', options?.productGroups ?? [])}

                    <View style={[styles.section, styles.energySection]}>
                        <SectionHeader
                            title={t('recipes:filter.energy-title')}
                            subtitle={t('recipes:filter.energy-subtitle')}
                        />
                        <View style={styles.rangeLabels}>
                            <AppText variant="bodySmallReg">{filters.kcalRange[0]}</AppText>
                            <AppText variant="bodySmallReg">
                                {filters.kcalRange[1] >= kcalMax
                                    ? t('recipes:filter.energy-max')
                                    : filters.kcalRange[1]}
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

                    {renderOptionGroup('cuisines', 'recipes:filter.cuisines-title', options?.cuisines ?? [])}
                    {renderOptionGroup('diets', 'recipes:filter.diets-title', options?.diets ?? [])}

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
            </QueryState>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    scroll: {
        paddingHorizontal: theme.spacing[4],
        // 40 під другою кнопкою (626:23348).
        paddingBottom: theme.spacing[10],
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
