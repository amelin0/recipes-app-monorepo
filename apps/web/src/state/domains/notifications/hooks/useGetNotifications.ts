'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { NotificationsApi } from '@/data'
import { Queries } from '@/shared/services'

export const useGetNotifications = (page: number) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [Queries.NOTIFICATIONS, page],
    queryFn: () => NotificationsApi.getAll(page),
    placeholderData: keepPreviousData,
  })

  return {
    notifications: data?.data ?? [],
    total: data?.total ?? 0,
    unreadCount: data?.unread_count ?? 0,
    page: data?.page ?? 1,
    isLoading,
    refetch,
  }
}
