import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import { useAppTranslation } from '@/shared/utils/translations';

import { MOCK_NOTIFICATIONS, type NotificationGroup } from '../notifications.constants';

type TabKey = 'all' | 'unread';

export const useNotificationsListScreen = () => {
    const { t } = useAppTranslation(['notifications']);

    // TODO: replace with the notifications endpoint; read state lives here only
    // until it does.
    const [groups, setGroups] = useState<NotificationGroup[]>(MOCK_NOTIFICATIONS);
    const [activeTab, setActiveTab] = useState<TabKey>('all');

    const hasUnread = useMemo(() => groups.some(group => group.items.some(item => !item.read)), [groups]);

    const visible = useMemo(() => {
        if (activeTab === 'all') return groups;

        return groups
            .map(group => ({ ...group, items: group.items.filter(item => !item.read) }))
            .filter(group => group.items.length > 0);
    }, [groups, activeTab]);

    const markRead = useCallback((id: string) => {
        setGroups(prev =>
            prev.map(group => ({
                ...group,
                items: group.items.map(item => (item.id === id ? { ...item, read: true } : item)),
            })),
        );
    }, []);

    const handleReadAll = useCallback(() => {
        setGroups(prev => prev.map(group => ({ ...group, items: group.items.map(item => ({ ...item, read: true })) })));
    }, []);

    const handleOpen = useCallback(
        (id: string) => {
            markRead(id);
            router.push({ pathname: '/(app)/notification-detail', params: { id } });
        },
        [markRead],
    );

    return {
        tabs: [
            { key: 'all', label: t('notifications:tabs.all') },
            { key: 'unread', label: t('notifications:tabs.unread') },
        ],
        activeTab,
        setActiveTab: (key: string) => setActiveTab(key === 'unread' ? 'unread' : 'all'),
        groups: visible,
        hasUnread,
        handleReadAll,
        handleOpen,
    };
};
