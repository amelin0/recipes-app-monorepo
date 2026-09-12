import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen, AppText, QueryState, SegmentedTabs, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { NotificationCard } from './components';
import { useNotificationsListScreen } from './useNotificationsListScreen';

/** Everything the app has told the user (811:67086). */
export const NotificationsListScreen = () => {
    const { t } = useAppTranslation(['notifications']);
    const {
        tabs,
        activeTab,
        setActiveTab,
        groups,
        isLoading,
        isError,
        isEmpty,
        handleRetry,
        handleEndReached,
        hasUnread,
        handleReadAll,
        handleOpen,
    } = useNotificationsListScreen();

    return (
        <AppScreen>
            <TopBar title={t('notifications:title')} />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                onScrollEndDrag={handleEndReached}
                onMomentumScrollEnd={handleEndReached}
            >
                <View style={styles.filters}>
                    <SegmentedTabs
                        contentSized
                        items={tabs}
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        style={styles.tabs}
                    />
                    <Pressable
                        accessibilityRole="button"
                        disabled={!hasUnread}
                        hitSlop={8}
                        onPress={handleReadAll}
                        style={styles.readAll(hasUnread)}
                    >
                        <AppText variant="bodySmallBold" style={styles.readAllLabel}>
                            {t('notifications:read-all')}
                        </AppText>
                    </Pressable>
                </View>

                <QueryState
                    isLoading={isLoading}
                    isError={isError}
                    isEmpty={isEmpty}
                    emptyMessage={t('notifications:empty')}
                    onRetry={handleRetry}
                    style={styles.stateBox}
                >
                    {groups.map(group => (
                        <View key={group.key} style={styles.group}>
                            <AppText variant="bodySmallBold" style={styles.groupLabel}>
                                {group.label}
                            </AppText>
                            {group.items.map(item => (
                                <NotificationCard key={item.id} item={item} onPress={() => handleOpen(item.id)} />
                            ))}
                        </View>
                    ))}
                </QueryState>
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    stateBox: {
        flex: 0,
        paddingVertical: theme.spacing[8],
    },
    content: {
        gap: theme.spacing[4],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[3],
        paddingBottom: theme.spacing[10],
    },
    filters: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    tabs: {
        flex: 1,
        minWidth: 0,
    },
    readAll: (enabled: boolean) => ({
        opacity: enabled ? 1 : 0.5,
    }),
    readAllLabel: {
        color: theme.colors.semantic.darkGrey,
    },
    group: {
        width: '100%',
        gap: theme.spacing[2],
    },
    groupLabel: {
        color: theme.colors.semantic.darkGrey,
    },
    empty: {
        width: '100%',
        textAlign: 'center',
        color: theme.colors.semantic.darkGrey,
    },
}));
