'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ProductApi } from '@/data'
import { Queries } from '@/shared/services'

export const useImportProducts = () => {
  const qc = useQueryClient()
  const { mutateAsync, isPending, data } = useMutation({
    mutationFn: (file: File) => ProductApi.importCsv(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [Queries.PRODUCTS] })
      qc.invalidateQueries({ queryKey: [Queries.PRODUCTS_SEARCH] })
    },
  })
  return { importProducts: mutateAsync, isPending, result: data }
}
