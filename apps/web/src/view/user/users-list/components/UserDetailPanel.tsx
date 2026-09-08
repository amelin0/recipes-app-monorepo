'use client'

import { SheetHeader, SheetTitle } from '@/shared/ui/components/sheet'
import { Badge } from '@/shared/ui/components/badge'
import { Button } from '@/shared/ui/components/button'
import { Separator } from '@/shared/ui/components/separator'
import { AlertTriangle } from 'lucide-react'
import { LANGUAGE_LABELS, SIGN_IN_METHOD_LABELS } from '../constants'
import type { UserDetail } from '@/data'

interface Props {
  user: UserDetail | null
  isLoading: boolean
  isBlocking: boolean
  isCancelling: boolean
  onBlock: () => void
  onCancelDeletion: () => void
}

export function UserDetailPanel({ user, isLoading, isBlocking, isCancelling, onBlock, onCancelDeletion }: Props) {
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-tertiary text-sm">Loading...</p>
      </div>
    )
  }

  const isBlocked = user.blockedAt !== null

  return (
    <div className="flex flex-col gap-6">
      <SheetHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {isBlocked && <Badge variant="destructive">Blocked</Badge>}
          {!user.isEmailVerified && <Badge variant="outline">Email unconfirmed</Badge>}
          {user.subscription && <Badge variant="default">{user.subscription.planSlug}</Badge>}
          {user.deletionRequest && (
            <Badge variant={user.deletionRequest.isOverdue ? 'destructive' : 'outline'}>
              {user.deletionRequest.isOverdue ? 'Deletion overdue' : 'Deletion requested'}
            </Badge>
          )}
        </div>
        <SheetTitle className="text-lg font-semibold text-text-primary">{user.name ?? 'No name yet'}</SheetTitle>
        <p className="text-sm text-text-secondary">{user.email}</p>
      </SheetHeader>

      <Separator />

      <section className="space-y-2">
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">Account</h3>
        <Row label="Registered" value={formatDate(user.createdAt)} />
        <Row label="Email" value={user.isEmailVerified ? 'Confirmed' : 'Not confirmed'} />
        <Row
          label="Sign-in"
          value={user.signInMethods.map((m) => SIGN_IN_METHOD_LABELS[m] ?? m).join(', ') || '—'}
        />
        <Row label="Language" value={user.language ? (LANGUAGE_LABELS[user.language] ?? user.language) : '—'} />
        {isBlocked && <Row label="Blocked since" value={formatDate(user.blockedAt!)} />}
      </section>

      <Separator />

      <section className="space-y-2">
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">Subscription</h3>
        {user.subscription ? (
          <>
            <Row label="Plan" value={user.subscription.planSlug} />
            <Row label="Status" value={user.subscription.status} />
            <Row label="Source" value={user.subscription.source} />
            <Row label="Runs until" value={formatDate(user.subscription.expiresAt)} />
            {isBlocked && (
              /* The store knows nothing about our block and keeps charging —
                 which is the conversation a refund starts from. */
              <p className="text-xs text-text-tertiary pt-1">
                Blocking does not stop the store from charging this subscription.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-text-tertiary">No active subscription.</p>
        )}
      </section>

      <Separator />

      <section className="space-y-2">
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">Activity</h3>
        <Row label="Own dishes" value={String(user.activity.ownRecipes)} />
        <Row label="Favourites" value={String(user.activity.favorites)} />
        <Row
          label="Last session"
          value={user.activity.lastSeenAt ? formatDate(user.activity.lastSeenAt) : 'Never signed in'}
        />
      </section>

      {user.deletionRequest && (
        <>
          <Separator />
          <section className="space-y-3">
            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Deletion request</h3>
            <Row label="Requested" value={formatDate(user.deletionRequest.requestedAt)} />
            <Row label="Scheduled for" value={formatDate(user.deletionRequest.scheduledFor)} />

            {user.deletionRequest.isOverdue && (
              <div className="flex items-start gap-2 rounded-lg border border-border-default p-3">
                <AlertTriangle size={16} className="text-error-default mt-0.5 shrink-0" />
                <p className="text-xs text-text-secondary">
                  The grace period has passed and nothing has erased this account — the executor does not exist yet
                  (ADR-0005). Until it does, this is worked off by hand.
                </p>
              </div>
            )}

            <Button variant="outline" onClick={onCancelDeletion} disabled={isCancelling} className="w-full">
              {isCancelling ? 'Cancelling...' : 'Cancel deletion request'}
            </Button>
          </section>
        </>
      )}

      <Separator />

      <section>
        <Button
          variant={isBlocked ? 'outline' : 'destructive'}
          onClick={onBlock}
          disabled={isBlocking}
          className="w-full"
        >
          {isBlocking ? 'Updating...' : isBlocked ? 'Unblock account' : 'Block account'}
        </Button>
        <p className="text-xs text-text-tertiary mt-1.5">
          {isBlocked
            ? 'Unblocking lets them sign in again. The sessions the block ended stay ended.'
            : 'Blocking signs every device out immediately and refuses new sign-ins.'}
        </p>
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-text-tertiary">{label}</span>
      <span className="text-text-primary text-right">{value}</span>
    </div>
  )
}

const formatDate = (value: string): string => new Date(value).toLocaleDateString()
