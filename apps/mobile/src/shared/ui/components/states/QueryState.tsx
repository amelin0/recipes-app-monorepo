import React from 'react';
import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useAppTranslation } from '@/shared/utils/translations';

import { AppButton } from '../buttons';
import { AppText } from '../texts';

export interface QueryStateProps {
    /** The query is fetching and has nothing to show yet. */
    isLoading?: boolean;
    /** The query failed. A retry button appears when `onRetry` is given. */
    isError?: boolean;
    /** The query succeeded but came back with nothing. */
    isEmpty?: boolean;
    /** Replaces the default «Тут поки порожньо» copy. */
    emptyMessage?: string;
    onRetry?: () => void;
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}

/**
 * The three states every server-backed screen has to answer for, in one place
 * so they read the same everywhere.
 *
 * Order matters: an error wins over a stale empty, and a first load wins over
 * both — a spinner next to «Тут поки порожньо» tells the reader two different
 * things at once.
 */
export const QueryState = ({
    isLoading,
    isError,
    isEmpty,
    emptyMessage,
    onRetry,
    style,
    children,
}: QueryStateProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['common']);

    if (isLoading) {
        return (
            <View style={[styles.centered, style]}>
                <ActivityIndicator color={theme.colors.branding.accent} />
            </View>
        );
    }

    if (isError) {
        return (
            <View style={[styles.centered, style]}>
                <AppText variant="bodyMediumReg" style={styles.message}>
                    {t('common:states.error')}
                </AppText>
                {onRetry ? (
                    <AppButton variant="secondary" size="md" label={t('common:actions.retry')} onPress={onRetry} />
                ) : null}
            </View>
        );
    }

    if (isEmpty) {
        return (
            <View style={[styles.centered, style]}>
                <AppText variant="bodyMediumReg" style={styles.message}>
                    {emptyMessage ?? t('common:states.empty')}
                </AppText>
            </View>
        );
    }

    return <>{children}</>;
};

const styles = StyleSheet.create(theme => ({
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[3],
        padding: theme.spacing[6],
    },
    message: {
        color: theme.colors.semantic.darkGrey,
        textAlign: 'center',
    },
}));
