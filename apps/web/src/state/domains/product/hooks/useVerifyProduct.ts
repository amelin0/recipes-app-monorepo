'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ProductApi } from '@/data'
import { Queries } from '@/shared/services'

export const useVerifyProduct = () => {
  const qc = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      ProductApi.verify(id, isVerified),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [Queries.PRODUCTS] })
      qc.invalidateQueries({ queryKey: [Queries.PRODUCT] })
    },
  })
  return { verifyProduct: mutateAsync, isPending }
}
