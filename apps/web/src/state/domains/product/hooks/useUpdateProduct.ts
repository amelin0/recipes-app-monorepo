'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ProductApi } from '@/data'
import type { UpdateProductParams } from '@/data'
import { Queries } from '@/shared/services'

export const useUpdateProduct = () => {
  const qc = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateProductParams }) =>
      ProductApi.update(id, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [Queries.PRODUCTS] })
      qc.invalidateQueries({ queryKey: [Queries.PRODUCT] })
    },
  })
  return { updateProduct: mutateAsync, isPending }
}
