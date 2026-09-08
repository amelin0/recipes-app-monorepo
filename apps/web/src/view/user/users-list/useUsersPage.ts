'use client'

import { useState, useDeferredValue } from 'react'
import {
  useBlockUser,
  useCancelDeletionRequest,
  useGetUser,
  useGetUsers,
  useOverdueDeletions,
} from '@/state/domains/user'
import type { DeletionFilter, UserFilters } from '@/data'

const PAGE_SIZE = 20

export const useUsersPage = () => {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'blocked' | 'unverified' | 'subscribed' | undefined>(undefined)
  const [deletion, setDeletion] = useState<DeletionFilter | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const debouncedSearch = useDeferredValue(search)

  const filters: UserFilters = {
    search: debouncedSearch || undefined,
    // One select rather than three checkboxes: «blocked», «unconfirmed» and
    // «paying» are the three questions support actually arrives with, and
    // combining them has no meaning anybody asked for.
    isBlocked: status === 'blocked' ? true : undefined,
    isEmailVerified: status === 'unverified' ? false : undefined,
    hasSubscription: status === 'subscribed' ? true : undefined,
    deletion,
    page,
    limit: PAGE_SIZE,
  }

  const { users, total, totalPages, isLoading } = useGetUsers(filters)
  const { user: selectedUser, isLoading: isDetailLoading } = useGetUser(selectedId)
  const { blockUser, isPending: isBlocking } = useBlockUser()
  const { cancelDeletionRequest, isPending: isCancelling } = useCancelDeletionRequest()
  const { overdueCount } = useOverdueDeletions()

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusChange = (value: typeof status) => {
    setStatus(value)
    setPage(1)
  }

  const handleDeletionChange = (value: DeletionFilter | undefined) => {
    setDeletion(value)
    setPage(1)
  }

  const handleRowClick = (id: string) => {
    setSelectedId(id)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = (open: boolean) => {
    if (!open) {
      setIsDetailOpen(false)
      setSelectedId(null)
    }
  }

  const handleBlockToggle = async () => {
    if (!selectedUser) return
    await blockUser({ id: selectedUser.id, blocked: selectedUser.blockedAt === null })
  }

  const handleCancelDeletion = async () => {
    if (!selectedUser) return
    await cancelDeletionRequest(selectedUser.id)
  }

  const handleShowOverdue = () => {
    setSearch('')
    setStatus(undefined)
    setDeletion('overdue')
    setPage(1)
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatus(undefined)
    setDeletion(undefined)
    setPage(1)
  }

  const hasFilters = search !== '' || status !== undefined || deletion !== undefined

  return {
    search, handleSearchChange,
    status, handleStatusChange,
    deletion, handleDeletionChange,
    hasFilters, handleClearFilters,
    overdueCount, handleShowOverdue,
    page, setPage, totalPages, total,
    users, isLoading,
    selectedUser, isDetailLoading, isDetailOpen, handleRowClick, handleCloseDetail,
    handleBlockToggle, isBlocking,
    handleCancelDeletion, isCancelling,
  }
}
