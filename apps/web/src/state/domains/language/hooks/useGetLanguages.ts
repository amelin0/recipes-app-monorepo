'use client'

import { useQuery } from '@tanstack/react-query'
import { LanguageApi } from '@/data'
import { Queries } from '@/shared/services'

export const useGetLanguages = () => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.LANGUAGES],
    queryFn: () => LanguageApi.getAll(),
  })
  return { languages: data ?? [], isLoading }
}
