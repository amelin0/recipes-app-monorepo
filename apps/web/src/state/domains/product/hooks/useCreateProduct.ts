'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ProductApi } from '@/data'
import type { SaveProductParams } from '@/data'
import { Queries } from '@/shared/services'

export const useCreateProduct = () => {
  const qc = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (params: SaveProductParams) => ProductApi.create(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [Queries.PRODUCTS] })
      qc.invalidateQueries({ queryKey: [Queries.PRODUCTS_SEARCH] })
    },
  })
  return { createProduct: mutateAsync, isPending }
}
