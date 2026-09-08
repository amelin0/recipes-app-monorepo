'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ProductApi } from '@/data'
import { Queries } from '@/shared/services'

/**
 * Out of the catalogue without deleting: dishes, meal-log entries and shopping
 * lists that reference the product stay intact, and it disappears from search
 * both here and in the app until someone restores it.
 */
export const useArchiveProduct = () => {
  const qc = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) => ProductApi.setArchived(id, archived),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [Queries.PRODUCTS] })
      qc.invalidateQueries({ queryKey: [Queries.PRODUCT] })
      qc.invalidateQueries({ queryKey: [Queries.PRODUCTS_SEARCH] })
    },
  })
  return { archiveProduct: mutateAsync, isPending }
}
