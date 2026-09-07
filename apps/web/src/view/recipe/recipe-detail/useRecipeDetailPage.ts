'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { toSaveParams, type SaveRecipeParams } from '@/data'
import { useGetRecipeFull, useUpdateRecipe, useUploadRecipeImage } from '@/state/domains/recipe'

export const useRecipeDetailPage = (id: string) => {
  const router = useRouter()
  const { recipe, isLoading } = useGetRecipeFull(id)
  const { updateRecipe, isPending: isSaving } = useUpdateRecipe()
  const { uploadImage, isUploading } = useUploadRecipeImage()
  const [activeTab, setActiveTab] = useState('uk')

  /**
   * The languages this dish is written in, taken from the dish itself.
   *
   * It used to come from `GET /admin/languages`, which has no server — so the
   * tab strip rendered empty and no translation was ever selected. The recipe
   * already carries the only list that matters here: the ones it has a title
   * in.
   */
  const availableLangs = recipe?.translations.map(t => t.language) ?? []

  useEffect(() => {
    if (availableLangs.length > 0 && !availableLangs.includes(activeTab)) {
      setActiveTab(availableLangs[0] as string)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableLangs.join(',')])

  const currentTranslation = recipe?.translations.find(t => t.language === activeTab)

  /**
   * Save one changed field without losing the rest.
   *
   * `PUT` replaces composition and steps wholesale, so every write has to
   * carry the whole dish — sending `{ photoUrl }` alone would empty the
   * ingredient list.
   */
  const save = (changes: Partial<SaveRecipeParams>) => {
    if (!recipe) return Promise.resolve(undefined)
    return updateRecipe({ id, data: toSaveParams(recipe, changes) })
  }

  const handlePhotoUpload = async (file: File) => {
    const publicUrl = await uploadImage(file)
    await save({ photoUrl: publicUrl })
  }

  const handleBack = () => router.push('/recipes/')

  return {
    recipe,
    isLoading,
    isSaving,
    isUploading,
    languages: availableLangs,
    activeTab,
    setActiveTab,
    currentTranslation,
    handlePhotoUpload,
    handleBack,
    save,
  }
}
