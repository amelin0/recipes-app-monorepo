'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { UsersPage } from '@/view/user'

/**
 * `?id=…` opens straight onto that account's card.
 *
 * That is the link a support ticket carries: most tickets are answered by the
 * state of the account, and «find them again by hand» is not one click
 * (support-inbox SC-002).
 */
function UsersRoute() {
  return <UsersPage initialUserId={useSearchParams().get('id')} />
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
