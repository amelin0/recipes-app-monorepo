import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';

import Animated, { SlideInDown } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { Product } from '@/data';
import { useDebouncedValue } from '@/shared/hooks';
import { AppButton, AppInput, AppText, CircleIconButton, QueryState } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetProducts } from '@/state/domains/catalog';

import CheckIcon from '../../../../../assets/icons/check.svg';
import CloseIcon from '../../../../../assets/icons/close.svg';
import SearchIcon from '../../../../../assets/icons/search.svg';

export interface IngredientPickerSheetProps {
    visible: boolean;
    /** Product ids already on the form — they open ticked. */
    selectedIds: string[];
    onApply: (products: Product[]) => void;
    onClose: () => void;
}

/**
 * «Додати інгредієнт» — picks products out of the catalogue.
 *
 * Multi-select with one «Додати» at the end rather than a row-by-row add: a
 * dish is assembled from several products at once, and closing the sheet per
 * ingredient would make a four-ingredient salad four round trips.
 */
export const IngredientPickerSheet = ({ visible, selectedIds, onApply, onClose }: IngredientPickerSheetProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes', 'common']);

    const [draft, setDraft] = useState<Product[]>([]);
    const [query, setQuery] = useState('');
    const search = useDebouncedValue(query.trim(), 300);

    // Кожне відкриття починає з чистого набору: на формі вже є те, що додали
    // раніше, і повторний вибір того самого дублював би рядок.
    useEffect(() => {
        if (visible) {
            setDraft([]);
            setQuery('');
        }
    }, [visible]);

    const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetProducts(
        search ? { q: search } : {},
    );

    const products = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);

    const toggle = (product: Product) =>
        setDraft(current =>
            current.some(item => item.id === product.id)
                ? current.filter(item => item.id !== product.id)
                : [...current, product],
        );

    const handleEndReached = () => {
        if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common:actions.close')}
                style={styles.scrim}
                onPress={onClose}
            />

            {/* Пошук у шторці відкриває клавіатуру, а кнопка «Додати» стоїть
                під списком: без цього вона лишається під клавіатурою. */}
            <KeyboardAvoidingView style={styles.sheetWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Animated.View entering={SlideInDown.duration(280)} style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={styles.labels}>
                            <AppText variant="titleMedium" accessibilityRole="header">
                                {t('recipes:create-dish.ingredient-picker-title')}
                            </AppText>
                            <AppText variant="bodyMediumReg" style={styles.subtitle}>
                                {t('recipes:create-dish.ingredient-picker-subtitle')}
                            </AppText>
                        </View>
                        <CircleIconButton accessibilityLabel={t('common:actions.close')} onPress={onClose}>
                            <CloseIcon width={20} height={20} color={theme.colors.elements.primary} />
                        </CircleIconButton>
                    </View>

                    <AppInput
                        placeholder={t('recipes:filter.catalog-placeholder')}
                        value={query}
                        onChangeText={setQuery}
                        autoCorrect={false}
                        leftSlot={<SearchIcon width={20} height={20} color={theme.colors.elements.tertiary} />}
                    />

                    <ScrollView
                        style={styles.list}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        onScrollEndDrag={handleEndReached}
                        onMomentumScrollEnd={handleEndReached}
                    >
                        <QueryState
                            isLoading={isLoading}
                            isError={isError}
                            isEmpty={!isLoading && !isError && products.length === 0}
                            emptyMessage={t('recipes:list.empty')}
                            onRetry={refetch}
                            style={styles.stateBox}
                        >
                            {products.map(product => {
                                const picked = draft.some(item => item.id === product.id);
                                const already = selectedIds.includes(product.id);
                                return (
                                    <Pressable
                                        key={product.id}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: picked, disabled: already }}
                                        disabled={already}
                                        onPress={() => toggle(product)}
                                        style={styles.option(picked, already)}
                                    >
                                        <AppText variant="bodyMediumBold" style={styles.optionLabel}>
                                            {product.group?.emoji ? `${product.group.emoji} ` : ''}
                                            {product.name}
                                        </AppText>
                                        <AppText variant="bodySmallReg" style={styles.subtitle}>
                                            {t('recipes:create-dish.per-100g', {
                                                value: Math.round(product.caloriesPer100g),
                                            })}
                                        </AppText>
                                        {picked ? (
                                            <CheckIcon width={24} height={24} color={theme.colors.semantic.positive} />
                                        ) : null}
                                    </Pressable>
                                );
                            })}
                        </QueryState>
                    </ScrollView>

                    <AppButton
                        fullWidth
                        disabled={draft.length === 0}
                        label={t('recipes:create-dish.ingredient-picker-apply', { count: draft.length })}
                        onPress={() => onApply(draft)}
                    />
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create(theme => ({
    scrim: {
        flex: 1,
        backgroundColor: theme.colors.background.overlay,
    },
    sheetWrap: {
        justifyContent: 'flex-end',
    },
    sheet: {
        // Шторка займає фіксовану частку екрана: список каталогу довгий, і
        // висота по вмісту робила б її на весь екран.
        maxHeight: '80%',
        borderTopLeftRadius: theme.radius.xl,
        borderTopRightRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.white,
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[6],
        paddingBottom: theme.spacing[10],
        gap: theme.spacing[4],
        ...theme.shadow.sheet,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[3],
    },
    labels: {
        flex: 1,
        gap: theme.spacing[1],
    },
    subtitle: {
        color: theme.colors.semantic.darkGrey,
    },
    list: {
        flexGrow: 0,
    },
    listContent: {
        gap: theme.spacing[2],
    },
    stateBox: {
        flex: 0,
        paddingVertical: theme.spacing[6],
    },
    option: (picked: boolean, already: boolean) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        minHeight: 56,
        paddingHorizontal: theme.spacing[3],
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: picked ? theme.colors.forms.positiveBorder : theme.colors.forms.lightBorder,
        backgroundColor: already ? theme.colors.semantic.lightGrey : theme.colors.semantic.white,
        opacity: already ? 0.6 : 1,
    }),
    optionLabel: {
        flex: 1,
        minWidth: 0,
    },
}));
