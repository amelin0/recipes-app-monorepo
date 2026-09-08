'use client'

import { useUsersPage } from './useUsersPage'
import { UserDetailPanel } from './components/UserDetailPanel'
import { LANGUAGE_LABELS } from './constants'
import { Input } from '@/shared/ui/components/input'
import { Button } from '@/shared/ui/components/button'
import { Badge } from '@/shared/ui/components/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/components/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/components/select'
import { Sheet, SheetContent } from '@/shared/ui/components/sheet'
import { Search, X, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react'
import type { DeletionFilter } from '@/data'

export function UsersPage({
  initialUserId = null,
  initialDeletion,
}: {
  initialUserId?: string | null
  initialDeletion?: DeletionFilter
}) {
  const {
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
  } = useUsersPage(initialUserId, initialDeletion)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">Users</h1>
        <p className="text-sm text-text-secondary mt-1">{total} user{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Nothing erases accounts yet (ADR-0005), and requests piling up look
          exactly like nothing happening. This is the only place that says so. */}
      {overdueCount > 0 && (
        <button
          onClick={handleShowOverdue}
          className="flex w-full items-center gap-2 rounded-lg border border-border-default px-4 py-3 text-left hover:bg-bg-surface transition-colors"
        >
          <AlertTriangle size={16} className="text-error-default shrink-0" />
          <span className="text-sm text-text-primary">
            {overdueCount} deletion request{overdueCount !== 1 ? 's' : ''} past the grace period and not acted on.
          </span>
          <span className="ml-auto text-xs text-text-tertiary">Show</span>
        </button>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-icon-default" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={status ?? '_all'}
          onValueChange={(v) => handleStatusChange(v === '_all' ? undefined : (v as typeof status))}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Any state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Any state</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="unverified">Email unconfirmed</SelectItem>
            <SelectItem value="subscribed">Subscribed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={deletion ?? '_all'}
          onValueChange={(v) => handleDeletionChange(v === '_all' ? undefined : (v as DeletionFilter))}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Any deletion state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Any deletion state</SelectItem>
            <SelectItem value="active">Deletion requested</SelectItem>
            <SelectItem value="overdue">Deletion overdue</SelectItem>
            <SelectItem value="none">No request</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X size={14} className="mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border-default overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-bg-surface">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Confirmed</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-text-tertiary">Loading...</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-text-tertiary">No users found</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  onClick={() => handleRowClick(user.id)}
                  className={`cursor-pointer hover:bg-bg-surface transition-colors ${user.blockedAt ? 'opacity-60' : ''}`}
                >
                  <TableCell className="font-medium">{user.name ?? '—'}</TableCell>
                  <TableCell className="text-text-secondary">{user.email}</TableCell>
                  <TableCell>{user.language ? (LANGUAGE_LABELS[user.language] ?? user.language) : '—'}</TableCell>
                  <TableCell>
                    {user.isEmailVerified && <CheckCircle size={16} className="text-success-default" />}
                  </TableCell>
                  <TableCell>{user.hasActiveSubscription ? <Badge variant="default">Active</Badge> : '—'}</TableCell>
                  <TableCell className="space-x-1">
                    {user.blockedAt && <Badge variant="destructive">Blocked</Badge>}
                    {user.deletionScheduledFor && <Badge variant="outline">Deletion</Badge>}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-tertiary">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Detail panel */}
      <Sheet open={isDetailOpen} onOpenChange={handleCloseDetail}>
        <SheetContent className="w-[560px] sm:max-w-xl overflow-y-auto p-8">
          <UserDetailPanel
            user={selectedUser}
            isLoading={isDetailLoading}
            isBlocking={isBlocking}
            isCancelling={isCancelling}
            onBlock={handleBlockToggle}
            onCancelDeletion={handleCancelDeletion}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
