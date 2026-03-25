'use client'

import { useState } from 'react'
import { useGetNotifications, useMarkAllRead } from '@/state/domains/notifications'

export const useNotificationsPage = () => {
  const [page, setPage] = useState(1)
  const { notifications, total, unreadCount, isLoading, refetch } = useGetNotifications(page)
  const { markAllRead, isPending: isMarking } = useMarkAllRead()

  const totalPages = Math.ceil(total / 20)

  const handleMarkAllRead = async () => {
    await markAllRead()
    refetch()
  }

  return {
    notifications, total, unreadCount, page, totalPages, isLoading,
    isMarking, setPage, handleMarkAllRead,
  }
}
