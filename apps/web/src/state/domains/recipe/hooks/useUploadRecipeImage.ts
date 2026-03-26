'use client'

import { useMutation } from '@tanstack/react-query'
import { RecipeApi } from '@/data'

export const useUploadRecipeImage = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (file: File) => RecipeApi.uploadImage(file),
  })
  return { uploadImage: mutateAsync, isUploading: isPending }
}
