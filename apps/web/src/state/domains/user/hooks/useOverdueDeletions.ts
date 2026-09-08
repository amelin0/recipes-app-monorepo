'use client'

import { useQuery } from '@tanstack/react-query'
import { UserApi } from '@/data'
import { Queries } from '@/shared/services'

/**
 * How many deletion requests are past their date with nothing done about them.
 *
 * The same filter the directory uses, asked for one row: the count comes back
 * in `meta.total`. A dedicated endpoint would be a second source for one number
 * — and the two would disagree the day one of them learned about cancellations.
 *
 * Nothing executes these yet (ADR-0005), so this counter is the only thing
 * standing between «piling up» and «nobody noticed».
 */
export const useOverdueDeletions = () => {
  const { data } = useQuery({
    queryKey: [Queries.ADMIN_USERS, { deletion: 'overdue', count: true }],
    queryFn: () => UserApi.getAll({ deletion: 'overdue', page: 1, limit: 1 }),
  })

  return { overdueCount: data?.meta.total ?? 0 }
}
