import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppInput, AppText, Chip, ScreenActions } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import SearchIcon from '../../../../assets/icons/search.svg';

import { useFilterIngredientsScreen } from './useFilterIngredientsScreen';

/** Всі інгредієнти — searchable multi-select catalog sheet (626:22930/21538/22022). */
export const FilterIngredientsScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes', 'common']);
    const { catalog, query, setQuery, selectedCount, isSelected, handleToggle, handleClear, handleClose, handleApply } =
        useFilterIngredientsScreen();

    return (
        <View style={styles.root}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common:actions.close')}
                onPress={handleClose}
                style={styles.overlay}
            />

            <View style={styles.sheet}>
                <View style={styles.headerBar}>
                    <AppText variant="titleMedium" style={styles.headerTitle}>
                        {t('recipes:filter.catalog-title')}
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

                <View style={styles.searchField}>
                    <AppInput
                        placeholder={t('recipes:filter.catalog-placeholder')}
                        value={query}
                        onChangeText={setQuery}
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

                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {catalog.length > 0 ? (
                        <View style={styles.chipsWrap}>
                            {catalog.map(key => (
                                <Chip
                                    key={key}
                                    label={t(`recipes:ingredients.${key}`)}
                                    selected={isSelected(key)}
                                    onPress={() => handleToggle(key)}
                                />
                            ))}
                        </View>
                    ) : (
                        <AppText variant="bodyMediumReg" color="tertiary">
                            {t('recipes:list.empty')}
                        </AppText>
                    )}
                </ScrollView>

                <ScreenActions style={styles.footer}>
                    <AppButton
                        label={
                            selectedCount > 0
                                ? t('recipes:filter.apply-count', { count: selectedCount })
                                : t('recipes:filter.apply')
                        }
                        disabled={selectedCount === 0}
                        onPress={handleApply}
                        fullWidth
                    />
                </ScreenActions>
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    root: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.background.overlay,
    },
    // The sheet hangs 58pt below the screen top (626:22930).
    sheet: {
        height: '93%',
        backgroundColor: theme.colors.background.screen,
        borderTopLeftRadius: theme.radius.xl,
        borderTopRightRadius: theme.radius.xl,
        overflow: 'hidden',
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
    searchField: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[4],
    },
    scrollArea: {
        flex: 1,
    },
    scroll: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[4],
    },
    chipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[2],
        width: '100%',
    },
    footer: {
        backgroundColor: theme.colors.background.screen,
    },
}));
