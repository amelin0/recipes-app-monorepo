import React from 'react';
import { ScrollView } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen, QueryState, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { FaqCategoryCard } from './components';
import { useFaqScreen } from './useFaqScreen';

/** Часті питання — an accordion of answer categories (969:27483, 970:27782). */
export const FaqScreen = () => {
    const { t } = useAppTranslation(['profile']);
    const { topics, isLoading, isError, isEmpty, handleRetry, isExpanded, toggle } = useFaqScreen();

    return (
        <AppScreen>
            <TopBar title={t('profile:faq-screen.title')} />

            <QueryState isLoading={isLoading} isError={isError} isEmpty={isEmpty} onRetry={handleRetry}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {topics.map(topic => (
                        <FaqCategoryCard
                            key={topic.id}
                            topic={topic}
                            expanded={isExpanded(topic.id)}
                            onToggle={() => toggle(topic.id)}
                        />
                    ))}
                </ScrollView>
            </QueryState>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[3],
        paddingBottom: theme.spacing[10],
    },
}));
