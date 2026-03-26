'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGetRecipeFull, useUpdateRecipe, useUploadRecipeImage } from '@/state/domains/recipe'
import { useGetLanguages } from '@/state/domains/language'

export const useRecipeDetailPage = (id: string) => {
  const router = useRouter()
  const { recipe, isLoading } = useGetRecipeFull(id)
  const { languages } = useGetLanguages()
  const { updateRecipe, isPending: isSaving } = useUpdateRecipe()
  const { uploadImage, isUploading } = useUploadRecipeImage()
  const [activeTab, setActiveTab] = useState('en')

  // Get languages that have translations for this recipe
  const translatedLangs = recipe?.recipe_translations?.map((t) => t.language) ?? []
  const availableLangs = languages.filter((l) => translatedLangs.includes(l.code))

  useEffect(() => {
    if (availableLangs.length > 0 && !translatedLangs.includes(activeTab)) {
      setActiveTab(availableLangs[0].code)
    }
  }, [availableLangs.length])

  const currentTranslation = recipe?.recipe_translations?.find((t) => t.language === activeTab)

  const handlePhotoUpload = async (file: File) => {
    const { url } = await uploadImage(file)
    await updateRecipe({ id, data: { photo_url: url } })
  }

  const handleBack = () => router.push('/recipes')

  return {
    recipe, isLoading, isSaving, isUploading,
    languages: availableLangs,
    allLanguages: languages,
    activeTab, setActiveTab,
    currentTranslation,
    handlePhotoUpload, handleBack,
    updateRecipe: (data: any) => updateRecipe({ id, data }),
  }
}
