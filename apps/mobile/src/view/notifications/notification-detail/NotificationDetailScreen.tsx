import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppCard, AppScreen, AppText, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { useNotificationDetailScreen } from './useNotificationDetailScreen';

/** One notification in full (811:67419, 1000:81573, 1022:79488). */
export const NotificationDetailScreen = () => {
    const { t } = useAppTranslation(['notifications']);
    const { item, handleAction } = useNotificationDetailScreen();

    if (!item) return <AppScreen />;

    return (
        <AppScreen>
            <TopBar title={t('notifications:title')} />

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
                        {item.detailsTitle ? <AppText variant="bodyMediumBold">{item.detailsTitle}</AppText> : null}
                        <View style={styles.bullets}>
                            {(item.bullets ?? [item.body]).map(line => (
                                <AppText key={line} variant="bodyMediumReg" style={styles.muted}>
                                    {item.bullets ? `• ${line}` : line}
                                </AppText>
                            ))}
                        </View>
                    </View>

                    {item.tag ? (
                        <View style={styles.tag}>
                            <AppText variant="bodySmallReg" style={styles.tagLabel}>
                                {item.tag}
                            </AppText>
                        </View>
                    ) : null}

                    {item.action ? (
                        <AppButton
                            size="md"
                            fullWidth
                            label={t(`notifications:actions.${item.action}`)}
                            onPress={handleAction}
                        />
                    ) : null}
                </AppCard>
            </View>
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
