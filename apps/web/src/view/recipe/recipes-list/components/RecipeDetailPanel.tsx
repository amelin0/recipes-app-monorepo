'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, ImageIcon, Pencil, Plus, Trash2, X } from 'lucide-react'

import { toSaveParams, type Product, type RecipeDetail, type SaveRecipeParams, type Tag } from '@/data'
import { Badge } from '@/shared/ui/components/badge'
import { Button } from '@/shared/ui/components/button'
import { Input } from '@/shared/ui/components/input'
import { Separator } from '@/shared/ui/components/separator'
import { SheetHeader, SheetTitle } from '@/shared/ui/components/sheet'
import { useCreateRecipe, useSearchProducts, useUpdateRecipe, useUploadRecipeImage } from '@/state/domains/recipe'
import { useGetAllTags } from '@/state/domains/tag'

/**
 * Two languages, and only two, because that is what the product ships.
 *
 * Ukrainian is required — every read `coalesce`s onto it, so a dish without it
 * renders with an empty title in every other locale, and the API rejects it.
 */
const LANGUAGES = [
  { code: 'uk', label: 'Українська', required: true },
  { code: 'en', label: 'English', required: false },
] as const

// ─── Detail panel (view / edit an existing recipe) ───

export function RecipeDetailPanel({ recipe, isLoading }: { recipe: RecipeDetail | null; isLoading: boolean }) {
  const [isEditing, setIsEditing] = useState(false)

  // Opening a different recipe closes the editor. Adjusted during render
  // rather than in an effect: an effect would paint the previous dish's form
  // once before correcting itself, and React flags the cascading render.
  const [shownId, setShownId] = useState(recipe?.id)
  if (recipe?.id !== shownId) {
    setShownId(recipe?.id)
    setIsEditing(false)
  }

  if (isLoading || !recipe) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-tertiary text-sm">Loading...</p>
      </div>
    )
  }

  return isEditing ? (
    <RecipeForm recipe={recipe} onDone={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />
  ) : (
    <ViewMode recipe={recipe} onEdit={() => setIsEditing(true)} />
  )
}

export function RecipeCreatePanel({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  return <RecipeForm recipe={null} onDone={onCreated} onCancel={onCancel} />
}

// ─── View mode ───

function ViewMode({ recipe, onEdit }: { recipe: RecipeDetail; onEdit: () => void }) {
  const router = useRouter()
  const { uploadImage, isUploading } = useUploadRecipeImage()
  const { updateRecipe } = useUpdateRecipe()
  const { tags } = useGetAllTags()
  const fileRef = useRef<HTMLInputElement>(null)

  const title = recipe.translations.find(t => t.language === 'uk')?.title ?? recipe.translations[0]?.title

  const handlePhotoUpload = async (file: File) => {
    const publicUrl = await uploadImage(file)
    // The whole dish, not just the photo: PUT replaces composition and steps,
    // so a lone `{ photoUrl }` would empty the ingredient list.
    await updateRecipe({ id: recipe.id, data: toSaveParams(recipe, { photoUrl: publicUrl }) })
  }

  const taxonomy = [recipe.categoryId, recipe.cuisineId, ...recipe.dietIds].filter(
    (id): id is string => id !== null,
  )

  return (
    <div className="flex flex-col gap-6">
      <SheetHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {taxonomy.map(id => (
              <Badge key={id} variant="outline" className="text-xs">
                {tags.find(tag => tag.id === id)?.name ?? id}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            {/* The sheet is a preview; the full page shows every translation
                and every step. Nothing linked to it before, so it was
                reachable only by typing the URL. */}
            <Button variant="ghost" size="sm" onClick={() => router.push(`/recipes/detail/?id=${recipe.id}`)}>
              <ExternalLink size={14} className="mr-1.5" /> Open
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil size={14} className="mr-1.5" /> Edit
            </Button>
          </div>
        </div>
        <SheetTitle className="text-lg font-semibold text-text-primary">{title ?? 'Untitled'}</SheetTitle>
        {recipe.importKey && (
          <p className="text-xs text-text-tertiary">
            Imported as <span className="font-mono">{recipe.importKey}</span>
          </p>
        )}
      </SheetHeader>

      <div
        onClick={() => fileRef.current?.click()}
        className="w-full h-48 rounded-xl border-2 border-dashed border-border-default flex items-center justify-center cursor-pointer hover:border-primary-default transition-colors overflow-hidden"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
        />
        {recipe.photoUrl ? (
          <img src={recipe.photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-text-tertiary">
            <ImageIcon size={32} className="mx-auto mb-1" />
            <p className="text-xs">{isUploading ? 'Uploading...' : 'Add photo'}</p>
          </div>
        )}
      </div>

      <Separator />

      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">
          Nutrition — whole dish
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <NutritionCard label="Calories" value={recipe.calories} unit="kcal" />
          <NutritionCard label="Protein" value={recipe.proteinG} unit="g" />
          <NutritionCard label="Carbs" value={recipe.carbsG} unit="g" />
          <NutritionCard label="Fats" value={recipe.fatsG} unit="g" />
          <NutritionCard label="Servings" value={recipe.servings} unit="" />
          <NutritionCard label="Time" value={recipe.cookTimeMinutes ?? 0} unit="min" />
        </div>
        {/* Not editable anywhere: the server derives these from the composition,
            which is what keeps the number here equal to the list below it. */}
        <p className="text-xs text-text-tertiary mt-2">Computed from the ingredients.</p>
      </section>

      <Separator />

      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">
          Ingredients ({recipe.ingredients.length})
        </h3>
        <div className="space-y-1.5">
          {recipe.ingredients.map(line => (
            <div
              key={line.id}
              className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg hover:bg-bg-surface"
            >
              <span className="text-text-primary">{line.productName}</span>
              <span className="text-text-secondary font-medium">{line.amountG} g</span>
            </div>
          ))}
          {recipe.ingredients.length === 0 && <p className="text-text-tertiary text-sm">No ingredients</p>}
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">
          Steps ({recipe.steps.length})
        </h3>
        <ol className="space-y-2">
          {recipe.steps.map(step => {
            const text = step.translations.find(t => t.language === 'uk') ?? step.translations[0]
            return (
              <li key={step.id} className="text-sm">
                <span className="text-text-primary">
                  {step.stepNumber}. {text?.title ?? '—'}
                </span>
                {step.durationMinutes !== null && (
                  <span className="text-text-tertiary"> · {step.durationMinutes} min</span>
                )}
                {text?.description && <p className="ml-4 text-text-secondary text-xs mt-0.5">{text.description}</p>}
              </li>
            )
          })}
        </ol>
        {recipe.steps.length === 0 && <p className="text-text-tertiary text-sm">No steps</p>}
      </section>
    </div>
  )
}

// ─── Create / edit form ───

interface IngredientRow {
  productId: string
  productName: string
  amountG: string
}

interface StepRow {
  titleUk: string
  titleEn: string
  description: string
  duration: string
}

/**
 * One form for both create and edit.
 *
 * The old panel had two, and they disagreed: create collected macros by hand
 * and sent an empty composition, which the API now rejects — a dish needs at
 * least one ingredient, and its numbers come from that ingredient list.
 */
function RecipeForm({
  recipe,
  onDone,
  onCancel,
}: {
  recipe: RecipeDetail | null
  onDone: () => void
  onCancel: () => void
}) {
  const { tags } = useGetAllTags()
  const { createRecipe, isPending: isCreating } = useCreateRecipe()
  const { updateRecipe, isPending: isUpdating } = useUpdateRecipe()

  const [titleUk, setTitleUk] = useState(recipe?.translations.find(t => t.language === 'uk')?.title ?? '')
  const [titleEn, setTitleEn] = useState(recipe?.translations.find(t => t.language === 'en')?.title ?? '')
  const [servings, setServings] = useState(String(recipe?.servings ?? 1))
  const [cookTime, setCookTime] = useState(recipe?.cookTimeMinutes === null ? '' : String(recipe?.cookTimeMinutes ?? ''))
  const [categoryId, setCategoryId] = useState<string | null>(recipe?.categoryId ?? null)
  const [cuisineId, setCuisineId] = useState<string | null>(recipe?.cuisineId ?? null)
  const [dietIds, setDietIds] = useState<string[]>(recipe?.dietIds ?? [])

  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    recipe?.ingredients.map(line => ({
      productId: line.productId,
      productName: line.productName,
      amountG: String(line.amountG),
    })) ?? [],
  )

  const [steps, setSteps] = useState<StepRow[]>(
    recipe?.steps.map(step => ({
      titleUk: step.translations.find(t => t.language === 'uk')?.title ?? '',
      titleEn: step.translations.find(t => t.language === 'en')?.title ?? '',
      description: step.translations.find(t => t.language === 'uk')?.description ?? '',
      duration: step.durationMinutes === null ? '' : String(step.durationMinutes),
    })) ?? [],
  )

  const [error, setError] = useState<string | null>(null)

  const byKind = (kind: Tag['kind']) => tags.filter(tag => tag.kind === kind)

  const isSaving = isCreating || isUpdating
  const canSave = titleUk.trim().length > 0 && ingredients.length > 0 && ingredients.every(line => Number(line.amountG) > 0)

  const handleSave = async () => {
    setError(null)

    const payload: SaveRecipeParams = {
      importKey: recipe?.importKey ?? null,
      categoryId,
      cuisineId,
      dietIds,
      photoUrl: recipe?.photoUrl ?? null,
      servings: Number(servings) || 1,
      cookTimeMinutes: cookTime.trim() === '' ? null : Number(cookTime),
      translations: [
        { language: 'uk', title: titleUk.trim() },
        ...(titleEn.trim() ? [{ language: 'en', title: titleEn.trim() }] : []),
      ],
      ingredients: ingredients.map(line => ({ productId: line.productId, amountG: Number(line.amountG) })),
      steps: steps
        .filter(step => step.titleUk.trim())
        .map((step, index) => ({
          stepNumber: index + 1,
          durationMinutes: step.duration.trim() === '' ? null : Number(step.duration),
          translations: [
            { language: 'uk', title: step.titleUk.trim(), description: step.description.trim() || null },
            ...(step.titleEn.trim() ? [{ language: 'en', title: step.titleEn.trim(), description: null }] : []),
          ],
          // Chips are not editable here yet: they are a per-step ingredient
          // picker, and the import cannot express them either.
          ingredientIndexes: [],
        })),
    }

    try {
      if (recipe) await updateRecipe({ id: recipe.id, data: payload })
      else await createRecipe(payload)
      onDone()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SheetHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <SheetTitle className="text-lg font-semibold">{recipe ? 'Edit recipe' : 'New recipe'}</SheetTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X size={14} />
          </Button>
        </div>
      </SheetHeader>

      <section className="space-y-3">
        <Field label={`Title (${LANGUAGES[0].label}) — required`}>
          <Input value={titleUk} onChange={e => setTitleUk(e.target.value)} placeholder="Грецький салат" />
        </Field>
        <Field label={`Title (${LANGUAGES[1].label})`}>
          <Input value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="Greek salad" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Servings">
            <Input type="number" min={1} value={servings} onChange={e => setServings(e.target.value)} />
          </Field>
          <Field label="Cook time, min">
            <Input type="number" min={1} value={cookTime} onChange={e => setCookTime(e.target.value)} />
          </Field>
        </div>
      </section>

      <Separator />

      {/* One category, one cuisine, any number of diets — the shape of the
          model, not a UI preference. */}
      <section className="space-y-3">
        <ChipPicker
          label="Category"
          options={byKind('category')}
          selected={categoryId ? [categoryId] : []}
          onToggle={id => setCategoryId(current => (current === id ? null : id))}
        />
        <ChipPicker
          label="Cuisine"
          options={byKind('cuisine')}
          selected={cuisineId ? [cuisineId] : []}
          onToggle={id => setCuisineId(current => (current === id ? null : id))}
        />
        <ChipPicker
          label="Diets"
          options={byKind('diet')}
          selected={dietIds}
          onToggle={id =>
            setDietIds(current => (current.includes(id) ? current.filter(x => x !== id) : [...current, id]))
          }
        />
      </section>

      <Separator />

      <IngredientsEditor rows={ingredients} setRows={setIngredients} />

      <Separator />

      <StepsEditor rows={steps} setRows={setSteps} />

      {error && <p className="text-sm text-error-default">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!canSave || isSaving} className="flex-1">
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
      {!canSave && (
        <p className="text-xs text-text-tertiary">
          A title in Ukrainian and at least one ingredient with a weight are required.
        </p>
      )}
    </div>
  )
}

// ─── Composition editor ───

function IngredientsEditor({
  rows,
  setRows,
}: {
  rows: IngredientRow[]
  setRows: (update: (rows: IngredientRow[]) => IngredientRow[]) => void
}) {
  const [search, setSearch] = useState('')
  const { products } = useSearchProducts(search.trim() || undefined)

  const chosen = useMemo(() => new Set(rows.map(row => row.productId)), [rows])

  const add = (product: Product) => {
    setRows(current => [...current, { productId: product.id, productName: product.name, amountG: '100' }])
    setSearch('')
  }

  return (
    <section>
      <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">
        Ingredients — grams only
      </h3>

      <div className="space-y-1.5 mb-3">
        {rows.map((row, index) => (
          <div key={`${row.productId}-${index}`} className="flex items-center gap-2">
            <span className="flex-1 text-sm text-text-primary truncate">{row.productName}</span>
            <Input
              type="number"
              min={1}
              value={row.amountG}
              onChange={e =>
                setRows(current => current.map((item, i) => (i === index ? { ...item, amountG: e.target.value } : item)))
              }
              className="w-24 h-8"
            />
            <span className="text-xs text-text-tertiary w-4">g</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRows(current => current.filter((_, i) => i !== index))}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-text-tertiary text-sm">Nothing yet</p>}
      </div>

      {/* Search only — there is deliberately no «create product» here: an
          invented row would have no macros and the dish would stop being
          countable. */}
      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search the product catalogue..."
        className="h-8"
      />
      {search.trim() && (
        <div className="mt-1.5 max-h-48 overflow-y-auto rounded-lg border border-border-default">
          {products
            .filter(product => !chosen.has(product.id))
            .map(product => (
              <button
                key={product.id}
                type="button"
                onClick={() => add(product)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-bg-surface text-left"
              >
                <span className="text-text-primary">{product.name}</span>
                <span className="text-text-tertiary text-xs">{product.caloriesPer100g} kcal/100g</span>
              </button>
            ))}
          {products.length === 0 && <p className="px-3 py-2 text-sm text-text-tertiary">Nothing found</p>}
        </div>
      )}
    </section>
  )
}

// ─── Steps editor ───

function StepsEditor({
  rows,
  setRows,
}: {
  rows: StepRow[]
  setRows: (update: (rows: StepRow[]) => StepRow[]) => void
}) {
  const patch = (index: number, changes: Partial<StepRow>) =>
    setRows(current => current.map((row, i) => (i === index ? { ...row, ...changes } : row)))

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Steps</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRows(current => [...current, { titleUk: '', titleEn: '', description: '', duration: '' }])}
        >
          <Plus size={14} className="mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="rounded-lg border border-border-default p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-tertiary">Step {index + 1}</span>
              <Button variant="ghost" size="sm" onClick={() => setRows(current => current.filter((_, i) => i !== index))}>
                <Trash2 size={14} />
              </Button>
            </div>
            <Input value={row.titleUk} onChange={e => patch(index, { titleUk: e.target.value })} placeholder="Наріжте овочі" className="h-8" />
            <Input value={row.titleEn} onChange={e => patch(index, { titleEn: e.target.value })} placeholder="Chop the vegetables" className="h-8" />
            <Input value={row.description} onChange={e => patch(index, { description: e.target.value })} placeholder="Деталі (необовʼязково)" className="h-8" />
            <Input type="number" min={1} value={row.duration} onChange={e => patch(index, { duration: e.target.value })} placeholder="Хвилин" className="h-8 w-28" />
          </div>
        ))}
        {rows.length === 0 && <p className="text-text-tertiary text-sm">No steps</p>}
      </div>
    </section>
  )
}

// ─── Small pieces ───

function ChipPicker({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: Tag[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div>
      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(tag => (
          <button key={tag.id} type="button" onClick={() => onToggle(tag.id)}>
            <Badge variant={selected.includes(tag.id) ? 'default' : 'outline'} className="text-xs cursor-pointer">
              {tag.emoji ? `${tag.emoji} ` : ''}
              {tag.name}
            </Badge>
          </button>
        ))}
        {options.length === 0 && <span className="text-xs text-text-tertiary">—</span>}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function NutritionCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-lg border border-border-default px-3 py-2">
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className="text-sm font-semibold text-text-primary">
        {value}
        {unit ? <span className="text-xs font-normal ml-0.5">{unit}</span> : null}
      </p>
    </div>
  )
}
