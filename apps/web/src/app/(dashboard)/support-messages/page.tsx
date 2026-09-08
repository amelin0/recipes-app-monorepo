'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { SupportMessagesPage } from '@/view/support'
import type { TicketStatus } from '@/data'

const STATUSES: TicketStatus[] = ['new', 'in_progress', 'resolved', 'rejected']

const asStatus = (value: string | null): TicketStatus | undefined =>
  STATUSES.find((status) => status === value)

/**
 * `?status=new` opens the queue already filtered.
 *
 * That is the link the dashboard's signal card carries: a counter that drops
 * you into an unfiltered list has not saved anybody the click it promised
 * (dashboard-overview FR-002).
 */
function SupportRoute() {
  return <SupportMessagesPage initialStatus={asStatus(useSearchParams().get('status'))} />
}

export default function SupportMessages() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-text-tertiary">Loading...</div>}>
      <SupportRoute />
    </Suspense>
  )
}
