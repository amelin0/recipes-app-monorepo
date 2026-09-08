'use client'

import { useQuery } from '@tanstack/react-query'
import { SupportApi } from '@/data'
import { Queries } from '@/shared/services'

/**
 * How many tickets nobody has touched.
 *
 * The same filter the queue uses, asked for one row: the number comes back in
 * `meta.total`. A dedicated endpoint would be a second source for one figure,
 * and the two would part ways the first time one of them learned about a state.
 */
export const useNewTicketCount = () => {
  const { data } = useQuery({
    queryKey: [Queries.SUPPORT_MESSAGES, { status: 'new', count: true }],
    queryFn: () => SupportApi.getAll({ status: 'new', page: 1, limit: 1 }),
  })

  return { newCount: data?.meta.total ?? 0 }
}
