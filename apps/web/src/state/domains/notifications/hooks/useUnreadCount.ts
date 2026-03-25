'use client'

import { useQuery } from '@tanstack/react-query'
import { NotificationsApi } from '@/data'
import { Queries } from '@/shared/services'

export const useUnreadCount = () => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.UNREAD_COUNT],
    queryFn: () => NotificationsApi.getUnreadCount(),
    refetchInterval: 30000,
  })

  return { unreadCount: data?.unread_count ?? 0, isLoading }
}
