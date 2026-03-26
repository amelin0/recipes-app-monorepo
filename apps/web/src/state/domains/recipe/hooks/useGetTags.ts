'use client'

import { useQuery } from '@tanstack/react-query'
import { RecipeApi } from '@/data'
import { Queries } from '@/shared/services'

export const useGetTags = () => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.TAGS],
    queryFn: () => RecipeApi.getTags(),
  })
  return { tags: data ?? [], isLoading }
}
