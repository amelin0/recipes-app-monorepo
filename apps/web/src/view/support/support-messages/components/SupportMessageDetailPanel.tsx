'use client'

import { useState } from 'react'
import { SheetHeader, SheetTitle } from '@/shared/ui/components/sheet'
import { Badge } from '@/shared/ui/components/badge'
import { Button } from '@/shared/ui/components/button'
import { Textarea } from '@/shared/ui/components/textarea'
import { Separator } from '@/shared/ui/components/separator'
import { Ban, Copy, ExternalLink, Lock } from 'lucide-react'
import { STATUS_LABEL, STATUS_VARIANT, TYPE_LABEL } from '../constants'
import type { TicketDetail, TicketStatus } from '@/data'

const MOVES: TicketStatus[] = ['new', 'in_progress', 'resolved', 'rejected']

interface Props {
  ticket: TicketDetail | null
  isLoading: boolean
  isMoving: boolean
  isAddingNote: boolean
  onMove: (status: TicketStatus) => void
  onAddNote: (body: string) => Promise<void>
}

export function SupportMessageDetailPanel({
  ticket,
  isLoading,
  isMoving,
  isAddingNote,
  onMove,
  onAddNote,
}: Props) {
  const [note, setNote] = useState('')

  if (isLoading || !ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-tertiary text-sm">Loading...</p>
      </div>
    )
  }

  const handleAddNote = async () => {
    const body = note.trim()
    if (!body) return
    await onAddNote(body)
    setNote('')
  }

  return (
    <div className="flex flex-col gap-6">
      <SheetHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_VARIANT[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
          <Badge variant="outline">{TYPE_LABEL[ticket.type]}</Badge>
          <span className="text-xs text-text-tertiary">{new Date(ticket.createdAt).toLocaleString()}</span>
        </div>
        <SheetTitle className="text-lg font-semibold text-text-primary">{TYPE_LABEL[ticket.type]}</SheetTitle>
      </SheetHeader>

      <Separator />

      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Move to</h3>
        <div className="flex flex-wrap gap-2">
          {MOVES.map((next) => (
            <Button
              key={next}
              size="sm"
              variant={next === ticket.status ? 'default' : 'outline'}
              disabled={isMoving || next === ticket.status}
              onClick={() => onMove(next)}
            >
              {STATUS_LABEL[next]}
            </Button>
          ))}
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">From</h3>
        {ticket.author ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-primary">{ticket.author.email}</span>
              {ticket.author.isBlocked && (
                <Badge variant="destructive" className="gap-1">
                  <Ban size={12} /> Blocked
                </Badge>
              )}
            </div>
            {/* Most tickets are answered by the state of the account, not by
                code — so the card is one click from the account. */}
            <a
              href={`/users/?id=${ticket.author.id}`}
              className="inline-flex items-center gap-1 text-xs text-primary-default hover:underline"
            >
              Open the account <ExternalLink size={12} />
            </a>
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">
            The author deleted their account. The ticket is kept without them.
          </p>
        )}

        <div className="mt-3">
          <p className="text-xs text-text-tertiary mb-1">Reply to</p>
          {ticket.replyEmail ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-primary">{ticket.replyEmail}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard?.writeText(ticket.replyEmail!)}
                aria-label="Copy the reply address"
              >
                <Copy size={14} />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">
              No address was given — there is nowhere to reply to this one.
            </p>
          )}
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Message</h3>
        <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
      </section>

      {ticket.imageUrls.length > 0 && (
        <>
          <Separator />
          <section>
            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">
              Attachments ({ticket.imageUrls.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {ticket.imageUrls.map((url) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="Attachment"
                    className="rounded-lg border border-border-default max-h-40 object-cover hover:opacity-90 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </section>
        </>
      )}

      {ticket.context != null && (
        <>
          <Separator />
          <section>
            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">App context</h3>
            <pre className="text-xs text-text-secondary bg-bg-surface rounded-lg p-3 overflow-x-auto">
              {JSON.stringify(ticket.context, null, 2)}
            </pre>
          </section>
        </>
      )}

      <Separator />

      <section>
        <h3 className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">
          <Lock size={12} /> Internal notes ({ticket.notes.length})
        </h3>
        <p className="text-xs text-text-tertiary mb-3">
          Only staff see these. Nothing here is sent to the person who wrote in.
        </p>

        <div className="space-y-2 mb-3">
          {ticket.notes.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-border-default p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text-primary">{entry.authorName}</span>
                <span className="text-xs text-text-tertiary">{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{entry.body}</p>
            </div>
          ))}
          {ticket.notes.length === 0 && <p className="text-sm text-text-tertiary">No notes yet.</p>}
        </div>

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What did you find out?"
          rows={3}
        />
        <Button onClick={handleAddNote} disabled={isAddingNote || note.trim() === ''} className="w-full mt-2">
          {isAddingNote ? 'Adding...' : 'Add note'}
        </Button>
      </section>
    </div>
  )
}
