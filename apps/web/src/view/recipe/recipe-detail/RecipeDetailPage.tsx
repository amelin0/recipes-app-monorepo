'use client'

import { useRecipeDetailPage } from './useRecipeDetailPage'
import type { RecipeDetail } from '@/data'
import { useGetTags } from '@/state/domains/recipe'
import { Button } from '@/shared/ui/components/button'
import { Badge } from '@/shared/ui/components/badge'
import { Separator } from '@/shared/ui/components/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/components/tabs'
import { ArrowLeft, Upload, ImageIcon } from 'lucide-react'
import { useRef } from 'react'

export function RecipeDetailPage({ id }: { id: string }) {
  const {
    recipe, isLoading, isUploading,
    languages, activeTab, setActiveTab,
    currentTranslation,
    handlePhotoUpload, handleBack,
  } = useRecipeDetailPage(id)
  const { tags } = useGetTags()
  const fileRef = useRef<HTMLInputElement>(null)
  const tagName = (id: string) => tags.find((tag) => tag.id === id)?.name ?? id

  if (isLoading || !recipe) {
    return <div className="py-12 text-center text-text-tertiary">Loading...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>
      </div>

      <div className="flex gap-8">
        {/* Photo */}
        <div className="shrink-0">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-48 h-48 rounded-xl border-2 border-dashed border-border-default flex items-center justify-center cursor-pointer hover:border-primary-default transition-colors overflow-hidden"
          >
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} />
            {recipe.photoUrl ? (
              <img src={recipe.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-text-tertiary">
                <ImageIcon size={32} className="mx-auto mb-1" />
                <p className="text-xs">{isUploading ? 'Uploading...' : 'Add photo'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">
              {currentTranslation?.title ?? 'Untitled'}
            </h1>
            <p className="text-sm text-text-tertiary mt-1">ID: {recipe.id}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <NutritionBadge label="Calories" value={`${recipe.calories}`} unit="kcal" />
            <NutritionBadge label="Protein" value={`${recipe.proteinG}`} unit="g" />
            <NutritionBadge label="Carbs" value={`${recipe.carbsG}`} unit="g" />
            <NutritionBadge label="Fats" value={`${recipe.fatsG}`} unit="g" />
            <NutritionBadge label="Servings" value={`${recipe.servings}`} unit="" />
            <NutritionBadge label="Time" value={recipe.cookTimeMinutes === null ? '-' : `${recipe.cookTimeMinutes}`} unit="min" />
          </div>

          {/* Category, cuisine and diets as one chip row — names come from
              /tags, because ids alone would be unreadable. */}
          <div className="flex flex-wrap gap-1.5">
            {tagsOf(recipe).map((tagId) => (
              <Badge key={tagId} variant="outline">
                {tagName(tagId)}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Language Tabs */}
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text-primary mb-4">Translations</h2>

        {languages.length === 0 ? (
          <p className="text-text-tertiary text-sm">No translations available</p>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap h-auto gap-1">
              {languages.map((language) => (
                <TabsTrigger key={language} value={language} className="text-xs uppercase">
                  {language}
                </TabsTrigger>
              ))}
            </TabsList>

            {languages.map((language) => {
              const translation = recipe.translations.find((t) => t.language === language)
              return (
                <TabsContent key={language} value={language} className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Title</label>
                    <p className="text-text-primary text-lg mt-1">{translation?.title ?? '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Steps</label>
                    <ol className="list-decimal list-inside mt-2 space-y-1.5">
                      {recipe.steps.map((step) => {
                        const text = step.translations.find((t) => t.language === language)
                        return (
                          <li key={step.id} className="text-sm text-text-primary">
                            {text?.title ?? '—'}
                            {step.durationMinutes !== null && (
                              <span className="text-text-tertiary"> · {step.durationMinutes} min</span>
                            )}
                            {text?.description && <p className="ml-5 text-text-secondary">{text.description}</p>}
                          </li>
                        )
                      })}
                    </ol>
                    {recipe.steps.length === 0 && <p className="text-text-tertiary text-sm mt-2">No steps</p>}
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>
        )}
      </div>

      <Separator />

      {/* Ingredients */}
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text-primary mb-3">Ingredients</h2>
        <div className="space-y-2">
          {recipe.ingredients.map((line) => (
            <div key={line.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-bg-surface text-sm">
              <span className="text-text-primary">{line.productName}</span>
              {/* Grams, always: the model has no other unit. */}
              <span className="text-text-secondary font-medium">{line.amountG} g</span>
            </div>
          ))}
          {recipe.ingredients.length === 0 && <p className="text-text-tertiary text-sm">No ingredients</p>}
        </div>
      </div>
    </div>
  )
}

/** Category, cuisine and diets flattened into one list for the chip row. */
function tagsOf(recipe: RecipeDetail): string[] {
  return [recipe.categoryId, recipe.cuisineId, ...recipe.dietIds].filter((id): id is string => id !== null)
}

function NutritionBadge({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg border border-border-default px-3 py-1.5 text-center">
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className="text-sm font-semibold text-text-primary">{value}{unit ? <span className="text-xs font-normal ml-0.5">{unit}</span> : null}</p>
    </div>
  )
}
