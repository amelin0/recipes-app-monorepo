'use client'

import { useRecipeDetailPage } from './useRecipeDetailPage'
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
  const fileRef = useRef<HTMLInputElement>(null)

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
            {recipe.photo_url ? (
              <img src={recipe.photo_url} alt="" className="w-full h-full object-cover" />
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
            <NutritionBadge label="Protein" value={`${recipe.proteins_g}`} unit="g" />
            <NutritionBadge label="Carbs" value={`${recipe.carbs_g}`} unit="g" />
            <NutritionBadge label="Fats" value={`${recipe.fats_g}`} unit="g" />
            <NutritionBadge label="Servings" value={`${recipe.servings}`} unit="" />
            <NutritionBadge label="Time" value={`${recipe.cooking_time_minutes}`} unit="min" />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {recipe.recipe_tags?.map((rt) => (
              <Badge key={rt.tag_id} variant="outline">
                {rt.tags?.tag_translations?.find((t) => t.language === activeTab)?.name
                  ?? rt.tags?.tag_translations?.[0]?.name
                  ?? rt.tag_id}
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
              {languages.map((lang) => (
                <TabsTrigger key={lang.code} value={lang.code} className="text-xs">
                  {lang.native_name} ({lang.code})
                </TabsTrigger>
              ))}
            </TabsList>

            {languages.map((lang) => {
              const translation = recipe.recipe_translations?.find((t) => t.language === lang.code)
              return (
                <TabsContent key={lang.code} value={lang.code} className="mt-4 space-y-4" dir={lang.is_rtl ? 'rtl' : 'ltr'}>
                  <div>
                    <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Title</label>
                    <p className="text-text-primary text-lg mt-1">{translation?.title ?? '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Cooking Instructions</label>
                    <ol className="list-decimal list-inside mt-2 space-y-1.5">
                      {(translation?.cooking_instructions ?? []).map((step, i) => (
                        <li key={i} className="text-sm text-text-primary">{step}</li>
                      ))}
                    </ol>
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
          {recipe.recipe_ingredients?.map((ri, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-bg-surface text-sm">
              <span className="text-text-primary">
                {ri.ingredients?.ingredient_translations?.find((t) => t.language === activeTab)?.name
                  ?? ri.ingredients?.ingredient_translations?.[0]?.name
                  ?? 'Unknown'}
              </span>
              <span className="text-text-secondary font-medium">
                {ri.amount} {ri.unit}
              </span>
            </div>
          ))}
          {(!recipe.recipe_ingredients || recipe.recipe_ingredients.length === 0) && (
            <p className="text-text-tertiary text-sm">No ingredients</p>
          )}
        </div>
      </div>
    </div>
  )
}

function NutritionBadge({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg border border-border-default px-3 py-1.5 text-center">
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className="text-sm font-semibold text-text-primary">{value}{unit ? <span className="text-xs font-normal ml-0.5">{unit}</span> : null}</p>
    </div>
  )
}
