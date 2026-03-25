'use client'

import { useState, useDeferredValue } from 'react'
import { useGetUsers, useGetUser, useBlockUser } from '@/state/domains/user'
import type { UserFilters } from '@/data'

export const useUsersPage = () => {
  const [search, setSearch] = useState('')
  const [gender, setGender] = useState<string | undefined>(undefined)
  const [country, setCountry] = useState<string | undefined>(undefined)
  const [language, setLanguage] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const debouncedSearch = useDeferredValue(search)

  const filters: UserFilters = {
    search: debouncedSearch || undefined,
    gender,
    country,
    language,
    page,
    limit: 20,
  }

  const { users, total, isLoading } = useGetUsers(filters)
  const { user: selectedUser, isLoading: isDetailLoading } = useGetUser(selectedUserId)
  const { blockUser, isPending: isBlocking } = useBlockUser()

  const totalPages = Math.ceil(total / 20)

  const handleRowClick = (userId: string) => {
    setSelectedUserId(userId)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = (open: boolean) => {
    if (!open) {
      setIsDetailOpen(false)
      setSelectedUserId(null)
    }
  }

  const handleBlockToggle = async () => {
    if (!selectedUser) return
    await blockUser({ id: selectedUser.id, isBlocked: !selectedUser.is_blocked })
  }

  const handlePageChange = (newPage: number) => setPage(newPage)

  const handleClearFilters = () => {
    setSearch('')
    setGender(undefined)
    setCountry(undefined)
    setLanguage(undefined)
    setPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  return {
    search, handleSearchChange,
    gender, setGender,
    country, setCountry,
    language, setLanguage,
    page, totalPages, total,
    users, isLoading,
    isDetailOpen, handleCloseDetail,
    selectedUser, isDetailLoading, isBlocking,
    handleRowClick, handleBlockToggle, handlePageChange, handleClearFilters,
  }
}
