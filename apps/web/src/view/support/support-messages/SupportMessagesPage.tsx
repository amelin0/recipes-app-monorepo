'use client'

import { useSupportMessagesPage } from './useSupportMessagesPage'
import { SupportMessageDetailPanel } from './components/SupportMessageDetailPanel'
import { STATUS_LABEL, STATUS_VARIANT, TYPE_LABEL } from './constants'
import { Input } from '@/shared/ui/components/input'
import { Button } from '@/shared/ui/components/button'
import { Badge } from '@/shared/ui/components/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/components/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/components/select'
import { Sheet, SheetContent } from '@/shared/ui/components/sheet'
import { Search, X, ChevronLeft, ChevronRight, Inbox, Paperclip } from 'lucide-react'
import type { TicketStatus, TicketType } from '@/data'

export function SupportMessagesPage({ initialStatus }: { initialStatus?: TicketStatus }) {
  const {
    search, handleSearchChange,
    status, handleStatusChange,
    type, handleTypeChange,
    hasFilters, handleClearFilters,
    newCount, handleShowNew,
    page, setPage, totalPages, total,
    tickets, isLoading,
    selectedTicket, isDetailLoading, isDetailOpen, handleRowClick, handleCloseDetail,
    handleMove, isMoving,
    handleAddNote, isAddingNote,
  } = useSupportMessagesPage(initialStatus)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">Support</h1>
        <p className="text-sm text-text-secondary mt-1">{total} ticket{total !== 1 ? 's' : ''}</p>
      </div>

      {newCount > 0 && (
        <button
          onClick={handleShowNew}
          className="flex w-full items-center gap-2 rounded-lg border border-border-default px-4 py-3 text-left hover:bg-bg-surface transition-colors"
        >
          <Inbox size={16} className="text-primary-default shrink-0" />
          <span className="text-sm text-text-primary">
            {newCount} ticket{newCount !== 1 ? 's' : ''} nobody has looked at yet.
          </span>
          <span className="ml-auto text-xs text-text-tertiary">Show</span>
        </button>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-icon-default" />
          <Input
            placeholder="Search text or reply address..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={status ?? '_all'}
          onValueChange={(v) => handleStatusChange(v === '_all' ? undefined : (v as TicketStatus))}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Any state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Any state</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={type ?? '_all'}
          onValueChange={(v) => handleTypeChange(v === '_all' ? undefined : (v as TicketType))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Any type</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="not_working">Not working</SelectItem>
            <SelectItem value="improvement">Improvement</SelectItem>
            <SelectItem value="feature_request">Feature request</SelectItem>
            <SelectItem value="other">Other</SelectItem>
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
              <TableHead>State</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-text-tertiary">Loading...</TableCell>
              </TableRow>
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-text-tertiary">No tickets found</TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  onClick={() => handleRowClick(ticket.id)}
                  className="cursor-pointer hover:bg-bg-surface transition-colors"
                >
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary">{TYPE_LABEL[ticket.type]}</TableCell>
                  <TableCell className="max-w-md">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate">{ticket.description}</span>
                      {ticket.imageCount > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-text-tertiary shrink-0">
                          <Paperclip size={12} />
                          {ticket.imageCount}
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {ticket.author?.email ?? ticket.replyEmail ?? '—'}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {new Date(ticket.createdAt).toLocaleDateString()}
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
          <SupportMessageDetailPanel
            ticket={selectedTicket}
            isLoading={isDetailLoading}
            isMoving={isMoving}
            isAddingNote={isAddingNote}
            onMove={handleMove}
            onAddNote={handleAddNote}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
