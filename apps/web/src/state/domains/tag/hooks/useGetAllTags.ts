'use client'

import { useQuery } from '@tanstack/react-query'
import { TagApi } from '@/data'
import { Queries } from '@/shared/services'

export const useGetAllTags = () => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.TAGS_FULL],
    queryFn: () => TagApi.getAll(),
  })
  return { tags: data ?? [], isLoading }
}
