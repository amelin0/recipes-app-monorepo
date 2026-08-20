import React, { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppInput, AppText, CircleBackButton, ValueStepper } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import type { CreateDishIngredient, DishStep } from '../../recipe.constants';

export interface StepsEditorModalProps {
    visible: boolean;
    steps: DishStep[];
    /** Інгредієнти форми — чипси «Потрібні інгредієнти» (594:32250). */
    ingredients: CreateDishIngredient[];
    onStepChange: (id: string, patch: Partial<DishStep>) => void;
    onAddStep: () => void;
    onSave: () => void;
    onClose: () => void;
}

/** Спосіб приготування — посторінковий редактор кроків (594:32174). */
export const StepsEditorModal = ({
    visible,
    steps,
    ingredients,
    onStepChange,
    onAddStep,
    onSave,
    onClose,
}: StepsEditorModalProps) => {
    const { theme } = useUnistyles();
    const insets = useSafeAreaInsets();
    const { t } = useAppTranslation(['recipes', 'common']);
    const { width } = useWindowDimensions();

    const pagerRef = useRef<ScrollView>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Повторне відкриття завжди стартує з першої сторінки.
    useEffect(() => {
        if (visible) setActiveIndex(0);
    }, [visible]);

    // «Додати крок» гортає до щойно доданої сторінки.
    const previousCount = useRef(steps.length);
    useEffect(() => {
        if (visible && steps.length > previousCount.current) {
            pagerRef.current?.scrollTo({ x: (steps.length - 1) * width, animated: true });
            setActiveIndex(steps.length - 1);
        }
        previousCount.current = steps.length;
    }, [visible, steps.length, width]);

    const toggleIngredient = (step: DishStep, ingredientId: string) => {
        const selected = step.ingredientIds.includes(ingredientId);
        onStepChange(step.id, {
            ingredientIds: selected
                ? step.ingredientIds.filter(id => id !== ingredientId)
                : [...step.ingredientIds, ingredientId],
        });
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={[styles.screen, { paddingTop: insets.top }]}>
                <View style={styles.headerBar}>
                    <View style={styles.headerSide}>
                        <CircleBackButton onPress={onClose} />
                    </View>
                    <AppText variant="bodyLargeBold" style={styles.headerTitle}>
                        {t('recipes:create-dish.steps-title')}
                    </AppText>
                    <View style={styles.headerSide} />
                </View>

                <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <ScrollView
                        ref={pagerRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        onMomentumScrollEnd={event =>
                            setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width))
                        }
                    >
                        {steps.map((step, index) => (
                            <ScrollView
                                key={step.id}
                                style={{ width }}
                                contentContainerStyle={styles.page}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                accessibilityLabel={t('recipes:create-dish.step-page-a11y', { number: index + 1 })}
                            >
                                <View style={styles.card}>
                                    <View style={styles.badge}>
                                        <AppText variant="titleSmall" style={styles.badgeText}>
                                            {index + 1}
                                        </AppText>
                                    </View>

                                    <AppInput
                                        label={t('recipes:create-dish.step-name-label')}
                                        placeholder={t('recipes:create-dish.step-name-placeholder')}
                                        value={step.title}
                                        onChangeText={title => onStepChange(step.id, { title })}
                                        autoCorrect={false}
                                    />

                                    <TextInput
                                        value={step.description}
                                        onChangeText={description => onStepChange(step.id, { description })}
                                        placeholder={t('recipes:create-dish.step-description-placeholder')}
                                        placeholderTextColor={theme.colors.semantic.darkGrey}
                                        multiline
                                        textAlignVertical="top"
                                        style={styles.description}
                                    />

                                    <View style={styles.group}>
                                        <AppText variant="bodySmallReg" style={styles.groupLabel}>
                                            {t('recipes:create-dish.step-ingredients')}
                                        </AppText>
                                        <View style={styles.pills}>
                                            {ingredients.map(ingredient => {
                                                const selected = step.ingredientIds.includes(ingredient.id);
                                                return (
                                                    <Pressable
                                                        key={ingredient.id}
                                                        accessibilityRole="button"
                                                        accessibilityState={{ selected }}
                                                        onPress={() => toggleIngredient(step, ingredient.id)}
                                                        style={styles.pill(selected)}
                                                    >
                                                        <AppText variant="buttonTab" style={styles.pillLabel(selected)}>
                                                            {ingredient.name}
                                                        </AppText>
                                                    </Pressable>
                                                );
                                            })}
                                        </View>
                                    </View>

                                    <View style={styles.group}>
                                        <AppText variant="bodySmallReg" style={styles.groupLabel}>
                                            {t('recipes:create-dish.step-time')}
                                        </AppText>
                                        <ValueStepper
                                            value={t('recipes:create-dish.minutes-value', { count: step.minutes })}
                                            canDecrease={step.minutes > 1}
                                            onDecrease={() => onStepChange(step.id, { minutes: step.minutes - 1 })}
                                            onIncrease={() => onStepChange(step.id, { minutes: step.minutes + 1 })}
                                            decreaseLabel={t('recipes:create-dish.step-time-decrease')}
                                            increaseLabel={t('recipes:create-dish.step-time-increase')}
                                        />
                                    </View>
                                </View>
                            </ScrollView>
                        ))}
                    </ScrollView>

                    <View style={styles.dots}>
                        {steps.map((step, index) => (
                            <View key={step.id} style={styles.dot(index === activeIndex)} />
                        ))}
                    </View>
                </KeyboardAvoidingView>

                <View style={styles.footer}>
                    <AppButton
                        variant="secondary"
                        label={t('recipes:create-dish.add-step')}
                        onPress={onAddStep}
                        style={styles.footerButton}
                    />
                    <AppButton label={t('common:actions.save')} onPress={onSave} style={styles.footerButton} />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create(theme => ({
    screen: {
        flex: 1,
        backgroundColor: theme.colors.background.screen,
    },
    flex: {
        flex: 1,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[2],
    },
    headerSide: {
        width: 90,
        flexDirection: 'row',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
    },
    page: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[4],
    },
    card: {
        width: '100%',
        padding: theme.spacing[4],
        gap: theme.spacing[3],
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.white,
        ...theme.shadow.block,
    },
    badge: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.positive,
    },
    badgeText: {
        color: theme.colors.semantic.white,
    },
    description: {
        ...theme.typography.bodyLargeReg,
        minHeight: 140,
        padding: theme.spacing[4],
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.lightGrey,
        color: theme.colors.elements.primary,
    },
    group: {
        gap: theme.spacing[2],
        width: '100%',
    },
    groupLabel: {
        color: theme.colors.semantic.darkGrey,
    },
    pills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[2],
    },
    pill: (selected: boolean) => ({
        minHeight: 36,
        paddingHorizontal: theme.spacing[4],
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: selected ? theme.colors.branding.primary : theme.colors.semantic.lightGrey,
    }),
    pillLabel: (selected: boolean) => ({
        color: selected ? theme.colors.semantic.white : theme.colors.elements.primary,
    }),
    dots: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[3],
        paddingVertical: theme.spacing[2],
    },
    dot: (active: boolean) => ({
        width: active ? 32 : 8,
        height: 8,
        borderRadius: theme.radius.full,
        backgroundColor: active ? theme.colors.branding.primary : theme.colors.branding.disabled,
    }),
    footer: {
        flexDirection: 'row',
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        // 40 до фізичного низу, як у ScreenActions (594:32201).
        paddingBottom: theme.spacing[10],
    },
    footerButton: {
        flex: 1,
    },
}));
