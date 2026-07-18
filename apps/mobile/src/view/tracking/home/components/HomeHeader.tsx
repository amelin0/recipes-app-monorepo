import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Avatar, CircleIconButton } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import NotificationIcon from '../../../../../assets/icons/notification.svg';

export interface HomeHeaderProps {
    /** User initials for the avatar. */
    initials: string;
    /** Unread notifications count (badge hidden when 0). */
    notificationsCount: number;
    onAvatarPress: () => void;
    onNotificationsPress: () => void;
}

export const HomeHeader = ({ initials, notificationsCount, onAvatarPress, onNotificationsPress }: HomeHeaderProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['tracking']);

    return (
        <View style={styles.row}>
            <Avatar label={initials} onPress={onAvatarPress} accessibilityLabel={t('tracking:home.profile-a11y')} />
            <CircleIconButton
                accessibilityLabel={t('tracking:home.notifications-a11y')}
                badgeCount={notificationsCount}
                onPress={onNotificationsPress}
            >
                <NotificationIcon width={24} height={24} color={theme.colors.elements.primary} />
            </CircleIconButton>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 72,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
    },
}));
