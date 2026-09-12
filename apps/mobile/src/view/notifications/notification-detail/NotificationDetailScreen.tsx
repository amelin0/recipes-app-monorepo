import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppCard, AppScreen, AppText, QueryState, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { useNotificationDetailScreen } from './useNotificationDetailScreen';

/** One notification in full (811:67419, 1000:81573, 1022:79488). */
export const NotificationDetailScreen = () => {
    const { t } = useAppTranslation(['notifications']);
    const { item, isLoading, isError, handleRetry, handleAction } = useNotificationDetailScreen();

    return (
        <AppScreen>
            <TopBar title={t('notifications:title')} />

            <QueryState
                isLoading={isLoading}
                isError={isError}
                // Немає ендпоінта на одне сповіщення, тож діплінк із пуша,
                // відкритий на холодну, нічого не знайде — кажемо про це, а не
                // показуємо порожній екран (handoff §4.3).
                isEmpty={!item}
                emptyMessage={t('notifications:not-found')}
                onRetry={handleRetry}
            >
                {item ? (
                    <View style={styles.content}>
                        <AppCard style={styles.card}>
                            <View style={styles.header}>
                                <AppText variant="bodyLargeBold" accessibilityRole="header">
                                    {item.title}
                                </AppText>
                                {item.subtitle ? (
                                    <AppText variant="bodySmallReg" style={styles.muted}>
                                        {item.subtitle}
                                    </AppText>
                                ) : null}
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.details}>
                                <View style={styles.bullets}>
                                    {/* Порожній `items` — звичайне коротке сповіщення:
                                тоді тіло йде суцільним абзацом, без маркерів. */}
                                    {(item.items.length > 0 ? item.items : [item.body]).map((line, index) => (
                                        <AppText key={`${index}-${line}`} variant="bodyMediumReg" style={styles.muted}>
                                            {item.items.length > 0 ? `• ${line}` : line}
                                        </AppText>
                                    ))}
                                </View>
                            </View>

                            {item.metaLabel ? (
                                <View style={styles.tag}>
                                    <AppText variant="bodySmallReg" style={styles.tagLabel}>
                                        {item.metaLabel}
                                    </AppText>
                                </View>
                            ) : null}

                            {item.actionLabel && item.actionRoute ? (
                                <AppButton size="md" fullWidth label={item.actionLabel} onPress={handleAction} />
                            ) : null}
                        </AppCard>
                    </View>
                ) : null}
            </QueryState>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[3],
    },
    card: {
        alignItems: 'flex-start',
        gap: theme.spacing[4],
    },
    header: {
        width: '100%',
        gap: theme.spacing[1],
    },
    // Figma draws it as a zero-height line with a 1pt stroke.
    divider: {
        width: '100%',
        height: 1,
        marginVertical: -0.5,
        backgroundColor: theme.colors.forms.lightBorder,
    },
    details: {
        width: '100%',
        gap: theme.spacing[3],
    },
    bullets: {
        width: '100%',
        gap: theme.spacing[2],
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    // The design tints this chip outside the RFDS palette — see the spec.
    tag: {
        paddingHorizontal: theme.spacing[3],
        paddingVertical: 6,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.background.elements,
    },
    tagLabel: {
        color: theme.colors.semantic.darkGrey,
    },
}));
