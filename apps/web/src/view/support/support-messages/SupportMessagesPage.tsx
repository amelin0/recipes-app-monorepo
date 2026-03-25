'use client'

import { useSupportMessagesPage } from './useSupportMessagesPage'
import { SupportMessageDetailPanel } from './components/SupportMessageDetailPanel'
import { Badge } from '@/shared/ui/components/badge'
import { Button } from '@/shared/ui/components/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/ui/components/table'
import { Sheet, SheetContent } from '@/shared/ui/components/sheet'
import { ChevronLeft, ChevronRight, MessageSquare, Paperclip } from 'lucide-react'

const STATUS_VARIANT: Record<string, 'default' | 'outline' | 'destructive'> = {
  open: 'destructive',
  in_progress: 'outline',
  resolved: 'default',
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

export function SupportMessagesPage() {
  const {
    messages, total, page, totalPages, isLoading,
    selectedMessage, isDetailLoading, isDetailOpen,
    setPage, handleRowClick, handleCloseDetail,
  } = useSupportMessagesPage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">
          Support Messages
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {total} message{total !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="rounded-lg border border-border-default overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-bg-surface">
              <TableHead>Title</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attachment</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-text-tertiary">Loading...</TableCell>
              </TableRow>
            ) : messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-text-tertiary">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                  No support messages yet
                </TableCell>
              </TableRow>
            ) : (
              messages.map((msg) => (
                <TableRow
                  key={msg.id}
                  onClick={() => handleRowClick(msg.id)}
                  className="cursor-pointer hover:bg-bg-surface transition-colors"
                >
                  <TableCell className="font-medium max-w-[240px] truncate">{msg.title}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{msg.user.first_name} {msg.user.last_name}</p>
                      <p className="text-xs text-text-tertiary">{msg.user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[msg.status] ?? 'outline'}>
                      {STATUS_LABEL[msg.status] ?? msg.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {msg.photo_url && <Paperclip size={16} className="text-text-tertiary" />}
                  </TableCell>
                  <TableCell className="text-text-secondary text-sm">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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

      <Sheet open={isDetailOpen} onOpenChange={handleCloseDetail}>
        <SheetContent className="w-[560px] sm:max-w-xl overflow-y-auto p-8">
          <SupportMessageDetailPanel message={selectedMessage} isLoading={isDetailLoading} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
