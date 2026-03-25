'use client'

import { useUsersPage } from './useUsersPage'
import { UserDetailPanel } from './components/UserDetailPanel'
import { LANGUAGE_LABELS, COUNTRY_LABELS } from './constants'
import { Input } from '@/shared/ui/components/input'
import { Button } from '@/shared/ui/components/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/ui/components/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/ui/components/select'
import { Sheet, SheetContent } from '@/shared/ui/components/sheet'
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react'

export function UsersPage() {
  const {
    search, handleSearchChange,
    gender, setGender,
    country, setCountry,
    language, setLanguage,
    page, totalPages, total,
    users, isLoading,
    isDetailOpen, handleCloseDetail,
    selectedUser, isDetailLoading, isBlocking,
    handleRowClick, handleBlockToggle, handlePageChange, handleClearFilters,
  } = useUsersPage()

  const hasFilters = search || gender || country || language

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">
          Users
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {total} user{total !== 1 ? 's' : ''} total
        </p>
      </div>

      {/* Search + Filters */}
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

        <Select value={gender ?? ''} onValueChange={(v) => setGender(v === '_all' ? undefined : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All genders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={country ?? ''} onValueChange={(v) => setCountry(v === '_all' ? undefined : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All countries</SelectItem>
            {Object.entries(COUNTRY_LABELS).map(([code, name]) => (
              <SelectItem key={code} value={code}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={language ?? ''} onValueChange={(v) => setLanguage(v === '_all' ? undefined : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All languages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All languages</SelectItem>
            <SelectItem value="uk">Ukrainian</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ru">Russian</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
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
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-text-tertiary">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-text-tertiary">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  onClick={() => handleRowClick(user.id)}
                  className="cursor-pointer hover:bg-bg-surface transition-colors"
                >
                  <TableCell className="font-medium">{user.first_name}</TableCell>
                  <TableCell>{user.last_name}</TableCell>
                  <TableCell className="text-text-secondary">{user.email}</TableCell>
                  <TableCell className="capitalize">{user.gender ?? '—'}</TableCell>
                  <TableCell>{user.country ? (COUNTRY_LABELS[user.country] ?? user.country) : '—'}</TableCell>
                  <TableCell>{LANGUAGE_LABELS[user.language] ?? user.language}</TableCell>
                  <TableCell className="text-text-secondary">
                    {new Date(user.created_at).toLocaleDateString()}
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
          <p className="text-sm text-text-tertiary">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Side Panel */}
      <Sheet open={isDetailOpen} onOpenChange={handleCloseDetail}>
        <SheetContent className="w-[560px] sm:max-w-xl overflow-y-auto p-8">
          <UserDetailPanel
            user={selectedUser}
            isLoading={isDetailLoading}
            isBlocking={isBlocking}
            onBlock={handleBlockToggle}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
