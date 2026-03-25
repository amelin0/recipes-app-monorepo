'use client'

import { SheetHeader, SheetTitle } from '@/shared/ui/components/sheet'
import { Badge } from '@/shared/ui/components/badge'
import { Separator } from '@/shared/ui/components/separator'
import type { SupportMessageDetail } from '@/data'

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

interface Props {
  message: SupportMessageDetail | null
  isLoading: boolean
}

export function SupportMessageDetailPanel({ message, isLoading }: Props) {
  if (isLoading || !message) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-tertiary text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <SheetHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[message.status] ?? 'outline'}>
            {STATUS_LABEL[message.status] ?? message.status}
          </Badge>
          <span className="text-xs text-text-tertiary">
            {new Date(message.created_at).toLocaleString()}
          </span>
        </div>
        <SheetTitle className="text-lg font-semibold text-text-primary">
          {message.title}
        </SheetTitle>
      </SheetHeader>

      <Separator />

      {/* User info */}
      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">From</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-subtle flex items-center justify-center">
            <span className="text-xs font-semibold text-primary-on-subtle">
              {message.user.first_name?.[0]}{message.user.last_name?.[0]}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {message.user.first_name} {message.user.last_name}
            </p>
            <p className="text-xs text-text-tertiary">{message.user.email}</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Description */}
      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Message</h3>
        <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
          {message.description}
        </p>
      </section>

      {/* Photo */}
      {message.photo_url && (
        <>
          <Separator />
          <section>
            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Attachment</h3>
            <a href={message.photo_url} target="_blank" rel="noopener noreferrer">
              <img
                src={message.photo_url}
                alt="Attachment"
                className="rounded-lg border border-border-default max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              />
            </a>
          </section>
        </>
      )}
    </div>
  )
}
