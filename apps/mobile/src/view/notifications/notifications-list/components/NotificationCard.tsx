import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

import NotificationBingIcon from '../../../../../assets/icons/notification-bing.svg';
import type { NotificationItem } from '../../notifications.constants';

export interface NotificationCardProps {
    item: NotificationItem;
    onPress: () => void;
}

/** One notification in the list (811:67278). */
export const NotificationCard = ({ item, onPress }: NotificationCardProps) => {
    const { theme } = useUnistyles();

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.body}`}
            onPress={onPress}
            style={styles.card}
        >
            <View style={styles.avatar(item.read)}>
                <NotificationBingIcon
                    width={20}
                    height={20}
                    color={item.read ? theme.colors.semantic.darkGrey : theme.colors.branding.accent}
                />
            </View>

            <View style={styles.content}>
                <View style={styles.head}>
                    <AppText variant="bodyMediumBold" numberOfLines={1} style={styles.title}>
                        {item.title}
                    </AppText>
                    <AppText variant="overline" style={styles.time}>
                        {item.time}
                    </AppText>
                </View>
                <AppText variant="bodySmallReg" numberOfLines={2} style={styles.body}>
                    {item.body}
                </AppText>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    card: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        // 12 in Figma, less the 1pt border it centres on the edge and RN lays
        // outside the padding box (811:67278).
        padding: theme.spacing[3] - 1,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.background.screen,
    },
    // Unread keeps the green halo; read fades to the neutral chip.
    avatar: (read: boolean) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: read ? theme.colors.semantic.lightGrey : theme.colors.semantic.lightPositive,
    }),
    content: {
        flex: 1,
        minWidth: 0,
        gap: theme.spacing[1],
    },
    head: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing[2],
    },
    title: {
        flexShrink: 1,
    },
    time: {
        color: theme.colors.semantic.darkGrey,
    },
    body: {
        width: '100%',
        color: theme.colors.semantic.darkGrey,
    },
}));
