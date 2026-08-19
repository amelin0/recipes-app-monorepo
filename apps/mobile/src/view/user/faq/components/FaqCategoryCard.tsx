import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

import ArrowRightIcon from '../../../../../assets/icons/arrow-right.svg';
import ArrowUpIcon from '../../../../../assets/icons/arrow-up.svg';
import type { FaqCategory } from '../../faq.constants';

export interface FaqCategoryCardProps {
    category: FaqCategory;
    expanded: boolean;
    onToggle: () => void;
}

/** One FAQ section — header alone when collapsed, header + answers when open. */
export const FaqCategoryCard = ({ category, expanded, onToggle }: FaqCategoryCardProps) => {
    const { theme } = useUnistyles();
    const Chevron = expanded ? ArrowUpIcon : ArrowRightIcon;

    return (
        <View style={styles.card}>
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={category.title}
                onPress={onToggle}
                style={styles.header}
            >
                <AppText variant="bodyMediumBold" style={styles.title}>
                    {category.title}
                </AppText>
                <Chevron width={16} height={16} color={theme.colors.elements.primary} />
            </Pressable>

            {expanded
                ? category.items.map(item => (
                      <View key={item.question} style={styles.item}>
                          <View style={styles.questionRow}>
                              <AppText variant="bodySmallReg" style={styles.bullet}>
                                  {'•'}
                              </AppText>
                              <AppText variant="bodySmallReg" style={styles.question}>
                                  {item.question}
                              </AppText>
                          </View>
                          <AppText variant="bodySmallReg" style={styles.answer}>
                              {item.answer}
                          </AppText>
                      </View>
                  ))
                : null}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    card: {
        width: '100%',
        minHeight: 52,
        justifyContent: 'center',
        gap: theme.spacing[3],
        padding: theme.spacing[4],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightGrey,
        overflow: 'hidden',
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    title: {
        flex: 1,
        minWidth: 0,
    },
    item: {
        width: '100%',
        gap: theme.spacing[1],
    },
    questionRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    // The design hangs the bullet in an 18pt indent (969:27557).
    bullet: {
        width: 18,
        textAlign: 'center',
    },
    question: {
        flex: 1,
        minWidth: 0,
    },
    answer: {
        color: theme.colors.semantic.darkGrey,
    },
}));
