'use client'

import { useQuery } from '@tanstack/react-query'

import { TagApi } from '@/data'
import { Queries } from '@/shared/services'

/** The three dictionaries as one flat list, each entry labelled with its kind. */
export const useGetAllTags = () => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.TAGS],
    queryFn: () => TagApi.getAll(),
  })

  return { tags: data ?? [], isLoading }
}
