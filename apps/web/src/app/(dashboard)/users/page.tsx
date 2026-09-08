'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { UsersPage } from '@/view/user'
import type { DeletionFilter } from '@/data'

const DELETION_FILTERS: DeletionFilter[] = ['none', 'active', 'overdue']

const asDeletionFilter = (value: string | null): DeletionFilter | undefined =>
  DELETION_FILTERS.find((filter) => filter === value)

/**
 * `?id=…` opens straight onto that account's card; `?deletion=overdue` opens
 * the list already filtered.
 *
 * Those are the links a support ticket and the dashboard's signal card carry:
 * most tickets are answered by the state of an account, and a counter that
 * drops you into an unfiltered list saved nobody the click
 * (support-inbox SC-002, dashboard-overview FR-002).
 */
function UsersRoute() {
  const params = useSearchParams()

  return <UsersPage initialUserId={params.get('id')} initialDeletion={asDeletionFilter(params.get('deletion'))} />
}

export default function Users() {
  // `useSearchParams` suspends during prerender; without the boundary the
  // export step fails with «missing suspense boundary».
  return (
    <Suspense fallback={<div className="py-12 text-center text-text-tertiary">Loading...</div>}>
      <UsersRoute />
    </Suspense>
  )
}
