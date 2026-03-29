'use client'

import { useState, useEffect, useRef } from 'react'
import { SheetHeader, SheetTitle } from '@/shared/ui/components/sheet'
import { Badge } from '@/shared/ui/components/badge'
import { Button } from '@/shared/ui/components/button'
import { Input } from '@/shared/ui/components/input'
import { Separator } from '@/shared/ui/components/separator'
import { Switch } from '@/shared/ui/components/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/components/select'
import { Pencil, X, ImageIcon, Plus, Trash2 } from 'lucide-react'
import { useUpdateRecipe, useCreateRecipe, useUploadRecipeImage } from '@/state/domains/recipe'
import { useGetLanguages } from '@/state/domains/language'
import type { RecipeFull } from '@/data'

// ─── Detail panel (view/edit existing recipe) ───

interface DetailProps {
  recipe: RecipeFull | null
  isLoading: boolean
}

export function RecipeDetailPanel({ recipe, isLoading }: DetailProps) {
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => { setIsEditing(false) }, [recipe?.id])

  if (isLoading || !recipe) {
    return <div className="flex items-center justify-center h-64"><p className="text-text-tertiary text-sm">Loading...</p></div>
  }

  if (isEditing) {
    return <EditForm recipe={recipe} onCancel={() => setIsEditing(false)} onSaved={() => setIsEditing(false)} />
  }

  return <ViewMode recipe={recipe} onEdit={() => setIsEditing(true)} />
}

// ─── Create panel (new recipe) ───

interface CreateProps {
  onCreated: () => void
  onCancel: () => void
}

export function RecipeCreatePanel({ onCreated, onCancel }: CreateProps) {
  const { createRecipe, isPending } = useCreateRecipe()
  const { languages } = useGetLanguages()

  const [proteins, setProteins] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fats, setFats] = useState('')
  const [servings, setServings] = useState('1')
  const [cookingTime, setCookingTime] = useState('')

  const [translations, setTranslations] = useState<TranslationRow[]>(() =>
    languages.map((l) => ({
      language: l.code,
      title: '',
      cooking_instructions: [],
      enabled: l.code === 'uk',
    })),
  )

  useEffect(() => {
    if (languages.length > 0 && translations.length === 0) {
      setTranslations(languages.map((l) => ({
        language: l.code,
        title: '',
        cooking_instructions: [],
        enabled: l.code === 'uk',
      })))
    }
  }, [languages.length])

  const handleSave = async () => {
    const enabledTranslations = translations
      .filter((t) => t.enabled && t.title.trim())
      .map(({ language, title, cooking_instructions }) => ({ language, title, cooking_instructions }))

    if (enabledTranslations.length === 0) return

    await createRecipe({
      calories: calcCalories(proteins, carbs, fats),
      proteins_g: Number(proteins) || 0,
      carbs_g: Number(carbs) || 0,
      fats_g: Number(fats) || 0,
      servings: Number(servings) || 1,
      cooking_time_minutes: Number(cookingTime) || 0,
      translations: enabledTranslations,
      ingredients: [],
      tag_ids: [],
    })
    onCreated()
  }

  return (
    <div className="flex flex-col gap-6">
      <SheetHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">New Recipe</h2>
          <Button variant="ghost" size="sm" onClick={onCancel}><X size={16} /></Button>
        </div>
      </SheetHeader>

      <Separator />

      <NutritionFields
        proteins={proteins} setProteins={setProteins}
        carbs={carbs} setCarbs={setCarbs}
        fats={fats} setFats={setFats}
        servings={servings} setServings={setServings}
        cookingTime={cookingTime} setCookingTime={setCookingTime}
      />

      <Separator />

      <TranslationsEditor translations={translations} setTranslations={setTranslations} />

      <Separator />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1" disabled={isPending}>Cancel</Button>
        <Button onClick={handleSave} className="flex-1" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create'}
        </Button>
      </div>
    </div>
  )
}

// ─── View mode ───

function ViewMode({ recipe, onEdit }: { recipe: RecipeFull; onEdit: () => void }) {
  const { uploadImage, isUploading } = useUploadRecipeImage()
  const { updateRecipe } = useUpdateRecipe()
  const fileRef = useRef<HTMLInputElement>(null)
  const [instructionsLang, setInstructionsLang] = useState(recipe.recipe_translations?.[0]?.language ?? 'uk')

  const handlePhotoUpload = async (file: File) => {
    const { url } = await uploadImage(file)
    await updateRecipe({ id: recipe.id, data: { photo_url: url } })
  }

  const firstTranslation = recipe.recipe_translations?.[0]
  const selectedTranslation = recipe.recipe_translations?.find((t) => t.language === instructionsLang) ?? firstTranslation

  return (
    <div className="flex flex-col gap-6">
      <SheetHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {recipe.recipe_tags?.map((rt) => (
              <Badge key={rt.tag_id} variant="outline" className="text-xs">
                {rt.tags?.tag_translations?.[0]?.name ?? rt.tag_id}
              </Badge>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil size={14} className="mr-1.5" /> Edit
          </Button>
        </div>
        <SheetTitle className="text-lg font-semibold text-text-primary">
          {firstTranslation?.title ?? 'Untitled'}
        </SheetTitle>
      </SheetHeader>

      {/* Photo */}
      <div
        onClick={() => fileRef.current?.click()}
        className="w-full h-48 rounded-xl border-2 border-dashed border-border-default flex items-center justify-center cursor-pointer hover:border-primary-default transition-colors overflow-hidden"
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

      <Separator />

      {/* Nutrition */}
      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">Nutrition</h3>
        <div className="grid grid-cols-3 gap-3">
          <NutritionCard label="Calories" value={recipe.calories} unit="kcal" />
          <NutritionCard label="Protein" value={recipe.proteins_g} unit="g" />
          <NutritionCard label="Carbs" value={recipe.carbs_g} unit="g" />
          <NutritionCard label="Fats" value={recipe.fats_g} unit="g" />
          <NutritionCard label="Servings" value={recipe.servings} unit="" />
          <NutritionCard label="Time" value={recipe.cooking_time_minutes} unit="min" />
        </div>
      </section>

      <Separator />

      {/* Translations */}
      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">
          Translations ({recipe.recipe_translations?.length ?? 0})
        </h3>
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {recipe.recipe_translations?.map((t) => (
            <details key={t.language} className="group rounded-lg hover:bg-bg-surface">
              <summary className="flex items-center text-sm py-1.5 px-3 cursor-pointer list-none">
                <span className="text-text-tertiary font-mono text-xs w-16 shrink-0">{t.language}</span>
                <span className="text-text-primary flex-1 ml-3 truncate">{t.title}</span>
                <span className="text-text-tertiary text-xs ml-2 group-open:rotate-90 transition-transform">▶</span>
              </summary>
              {t.cooking_instructions?.length > 0 && (
                <div className="px-3 pb-3 pt-1 ml-16">
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1.5">Cooking Instructions</p>
                  <ol className="list-decimal list-inside space-y-1">
                    {t.cooking_instructions.map((step, i) => (
                      <li key={i} className="text-xs text-text-secondary">{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </details>
          ))}
        </div>
      </section>

      <Separator />

      {/* Ingredients */}
      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">
          Ingredients ({recipe.recipe_ingredients?.length ?? 0})
        </h3>
        <div className="space-y-1.5">
          {recipe.recipe_ingredients?.map((ri, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg hover:bg-bg-surface">
              <span className="text-text-primary">
                {ri.ingredients?.ingredient_translations?.find((t) => t.language === instructionsLang)?.name
                  ?? ri.ingredients?.ingredient_translations?.[0]?.name
                  ?? 'Unknown'}
              </span>
              <span className="text-text-secondary font-medium">
                {ri.amount} {ri.unit}
              </span>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Cooking Instructions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Cooking Instructions</h3>
          <Select value={instructionsLang} onValueChange={(v) => v && setInstructionsLang(v)}>
            <SelectTrigger className="w-28 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {recipe.recipe_translations?.map((t) => (
                <SelectItem key={t.language} value={t.language} className="text-xs">{t.language}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedTranslation?.cooking_instructions?.length ? (
          <ol className="list-decimal list-inside space-y-1.5">
            {selectedTranslation.cooking_instructions.map((step, i) => (
              <li key={i} className="text-sm text-text-primary">{step}</li>
            ))}
          </ol>
        ) : (
          <p className="text-text-tertiary text-sm">No instructions</p>
        )}
      </section>
    </div>
  )
}

// ─── Edit form ───

function EditForm({ recipe, onCancel, onSaved }: { recipe: RecipeFull; onCancel: () => void; onSaved: () => void }) {
  const { updateRecipe, isPending } = useUpdateRecipe()
  const { languages } = useGetLanguages()

  const [proteins, setProteins] = useState(String(recipe.proteins_g))
  const [carbs, setCarbs] = useState(String(recipe.carbs_g))
  const [fats, setFats] = useState(String(recipe.fats_g))
  const [servings, setServings] = useState(String(recipe.servings))
  const [cookingTime, setCookingTime] = useState(String(recipe.cooking_time_minutes))

  // Build translations for ALL languages: existing ones enabled, rest disabled
  const existingMap = new Map(
    (recipe.recipe_translations ?? []).map((t) => [t.language, t]),
  )

  const [translations, setTranslations] = useState<TranslationRow[]>(() =>
    languages.length > 0
      ? languages.map((l) => {
          const existing = existingMap.get(l.code)
          return {
            language: l.code,
            title: existing?.title ?? '',
            cooking_instructions: existing?.cooking_instructions ?? [],
            enabled: !!existing,
          }
        })
      : (recipe.recipe_translations ?? []).map((t) => ({
          language: t.language,
          title: t.title,
          cooking_instructions: t.cooking_instructions,
          enabled: true,
        })),
  )

  // When languages load async, merge them in
  useEffect(() => {
    if (languages.length === 0) return
    setTranslations((prev) => {
      const prevMap = new Map(prev.map((t) => [t.language, t]))
      return languages.map((l) => {
        const existing = prevMap.get(l.code)
        if (existing) return existing
        const fromRecipe = existingMap.get(l.code)
        return {
          language: l.code,
          title: fromRecipe?.title ?? '',
          cooking_instructions: fromRecipe?.cooking_instructions ?? [],
          enabled: !!fromRecipe,
        }
      })
    })
  }, [languages.length])

  const handleSave = async () => {
    const enabledTranslations = translations
      .filter((t) => t.enabled)
      .map(({ language, title, cooking_instructions }) => ({ language, title, cooking_instructions }))

    await updateRecipe({
      id: recipe.id,
      data: {
        calories: calcCalories(proteins, carbs, fats),
        proteins_g: Number(proteins),
        carbs_g: Number(carbs),
        fats_g: Number(fats),
        servings: Number(servings),
        cooking_time_minutes: Number(cookingTime),
        translations: enabledTranslations,
      },
    })
    onSaved()
  }

  return (
    <div className="flex flex-col gap-6">
      <SheetHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Edit Recipe</h2>
          <Button variant="ghost" size="sm" onClick={onCancel}><X size={16} /></Button>
        </div>
      </SheetHeader>

      <Separator />

      <NutritionFields
        proteins={proteins} setProteins={setProteins}
        carbs={carbs} setCarbs={setCarbs}
        fats={fats} setFats={setFats}
        servings={servings} setServings={setServings}
        cookingTime={cookingTime} setCookingTime={setCookingTime}
      />

      <Separator />

      <TranslationsEditor translations={translations} setTranslations={setTranslations} />

      <Separator />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1" disabled={isPending}>Cancel</Button>
        <Button onClick={handleSave} className="flex-1" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

// ─── Shared: translation row type ───

interface TranslationRow {
  language: string
  title: string
  cooking_instructions: string[]
  enabled: boolean
}

// ─── Shared: calorie calculation ───

function calcCalories(proteins: string, carbs: string, fats: string): number {
  return Math.round((Number(proteins) || 0) * 4 + (Number(carbs) || 0) * 4 + (Number(fats) || 0) * 9)
}

// ─── Shared: nutrition fields ───

function NutritionFields({ proteins, setProteins, carbs, setCarbs, fats, setFats, servings, setServings, cookingTime, setCookingTime }: {
  proteins: string; setProteins: (v: string) => void
  carbs: string; setCarbs: (v: string) => void
  fats: string; setFats: (v: string) => void
  servings: string; setServings: (v: string) => void
  cookingTime: string; setCookingTime: (v: string) => void
}) {
  const calories = calcCalories(proteins, carbs, fats)

  return (
    <section>
      <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">Nutrition</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-tertiary mb-1 block">Calories (kcal)</label>
          <Input type="number" value={calories} disabled className="bg-bg-surface" />
        </div>
        <div>
          <label className="text-xs text-text-tertiary mb-1 block">Protein (g)</label>
          <Input type="number" value={proteins} onChange={(e) => setProteins(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-text-tertiary mb-1 block">Carbs (g)</label>
          <Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-text-tertiary mb-1 block">Fats (g)</label>
          <Input type="number" value={fats} onChange={(e) => setFats(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-text-tertiary mb-1 block">Servings</label>
          <Input type="number" value={servings} onChange={(e) => setServings(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-text-tertiary mb-1 block">Time (min)</label>
          <Input type="number" value={cookingTime} onChange={(e) => setCookingTime(e.target.value)} />
        </div>
      </div>
    </section>
  )
}

// ─── Shared: translations editor with toggle + cooking instructions ───

function TranslationsEditor({ translations, setTranslations }: {
  translations: TranslationRow[]
  setTranslations: React.Dispatch<React.SetStateAction<TranslationRow[]>>
}) {
  const handleToggle = (lang: string) => {
    setTranslations((prev) => prev.map((t) => (t.language === lang ? { ...t, enabled: !t.enabled } : t)))
  }

  const handleTitleChange = (lang: string, title: string) => {
    setTranslations((prev) => prev.map((t) => (t.language === lang ? { ...t, title } : t)))
  }

  const handleStepChange = (lang: string, index: number, value: string) => {
    setTranslations((prev) => prev.map((t) => {
      if (t.language !== lang) return t
      const steps = [...t.cooking_instructions]
      steps[index] = value
      return { ...t, cooking_instructions: steps }
    }))
  }

  const handleAddStep = (lang: string) => {
    setTranslations((prev) => prev.map((t) => {
      if (t.language !== lang) return t
      return { ...t, cooking_instructions: [...t.cooking_instructions, ''] }
    }))
  }

  const handleRemoveStep = (lang: string, index: number) => {
    setTranslations((prev) => prev.map((t) => {
      if (t.language !== lang) return t
      return { ...t, cooking_instructions: t.cooking_instructions.filter((_, i) => i !== index) }
    }))
  }

  const enabledCount = translations.filter((t) => t.enabled).length

  return (
    <section>
      <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
        Translations ({enabledCount}/{translations.length})
      </h3>
      <p className="text-xs text-text-tertiary mb-3">
        Disabled languages won't show this recipe to users with that language.
      </p>
      <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
        {translations.map((t) => (
          <details key={t.language} className={`group rounded-lg border border-border-default ${!t.enabled ? 'opacity-50' : ''}`}>
            <summary className="flex items-center gap-2 py-2 px-3 cursor-pointer list-none">
              <Switch checked={t.enabled} onCheckedChange={() => handleToggle(t.language)} />
              <span className="text-text-tertiary font-mono text-xs w-14 shrink-0">{t.language}</span>
              <span className="text-text-primary flex-1 text-sm truncate">{t.title || '—'}</span>
              <span className="text-text-tertiary text-xs group-open:rotate-90 transition-transform">▶</span>
            </summary>

            <div className="px-3 pb-3 space-y-3">
              {/* Title */}
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Title</label>
                <Input
                  value={t.title}
                  onChange={(e) => handleTitleChange(t.language, e.target.value)}
                  disabled={!t.enabled}
                  placeholder="Recipe title..."
                />
              </div>

              {/* Cooking Instructions */}
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Cooking Instructions</label>
                <div className="space-y-1.5">
                  {t.cooking_instructions.map((step, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-xs text-text-tertiary mt-2.5 w-5 shrink-0 text-right">{i + 1}.</span>
                      <Input
                        value={step}
                        onChange={(e) => handleStepChange(t.language, i, e.target.value)}
                        disabled={!t.enabled}
                        placeholder={`Step ${i + 1}...`}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handleRemoveStep(t.language, i)}
                        disabled={!t.enabled}
                        className="shrink-0 text-text-tertiary hover:text-status-error h-9 w-9 p-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleAddStep(t.language)}
                    disabled={!t.enabled}
                    className="text-xs text-primary-default"
                  >
                    <Plus size={14} className="mr-1" /> Add step
                  </Button>
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

// ─── Shared: nutrition card ───

function NutritionCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-lg border border-border-default p-3">
      <p className="text-text-tertiary text-xs">{label}</p>
      <p className="text-lg font-semibold text-text-primary">
        {value}{unit && <span className="text-xs font-normal text-text-tertiary ml-1">{unit}</span>}
      </p>
    </div>
  )
}
