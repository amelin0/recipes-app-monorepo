'use client'

import { useState } from 'react'
import { SheetHeader, SheetTitle } from '@/shared/ui/components/sheet'
import { Button } from '@/shared/ui/components/button'
import { Input } from '@/shared/ui/components/input'
import { Switch } from '@/shared/ui/components/switch'
import { Separator } from '@/shared/ui/components/separator'
import { X } from 'lucide-react'
import { useCreateProduct, useUpdateProduct } from '@/state/domains/product'
import { HttpError } from '@/shared/services'
import type { ProductDetail, SaveProductParams } from '@/data'

interface Props {
  /** Absent means the form creates; present means it edits that product. */
  product?: ProductDetail
  onCancel: () => void
  onSaved: () => void
}

interface NameField {
  name: string
  servingLabel: string
}

const emptyField = (): NameField => ({ name: '', servingLabel: '' })

const fieldOf = (product: ProductDetail | undefined, language: string): NameField => {
  const translation = product?.translations.find((t) => t.language === language)
  return { name: translation?.name ?? '', servingLabel: translation?.servingLabel ?? '' }
}

/**
 * One form for both create and edit.
 *
 * `PUT` replaces translations whole, so the form always sends them all — which
 * is also why the languages it does not show are carried through untouched
 * rather than dropped.
 */
export function ProductForm({ product, onCancel, onSaved }: Props) {
  const { createProduct, isPending: isCreating } = useCreateProduct()
  const { updateProduct, isPending: isUpdating } = useUpdateProduct()

  const [uk, setUk] = useState<NameField>(() => (product ? fieldOf(product, 'uk') : emptyField()))
  const [en, setEn] = useState<NameField>(() => (product ? fieldOf(product, 'en') : emptyField()))

  const [groupSlug, setGroupSlug] = useState(product?.groupSlug ?? '')
  const [calories, setCalories] = useState(product ? String(product.caloriesPer100g) : '')
  const [protein, setProtein] = useState(product ? String(product.proteinPer100g) : '')
  const [carbs, setCarbs] = useState(product ? String(product.carbsPer100g) : '')
  const [fats, setFats] = useState(product ? String(product.fatsPer100g) : '')
  const [servingWeight, setServingWeight] = useState(
    product?.servingWeightG === null || product?.servingWeightG === undefined ? '' : String(product.servingWeightG),
  )
  const [isQuickPick, setIsQuickPick] = useState(product?.isQuickPick ?? false)
  const [error, setError] = useState<string | null>(null)

  const isPending = isCreating || isUpdating

  const buildParams = (): SaveProductParams => {
    // Languages the panel does not edit are preserved: the request replaces the
    // whole set, so anything left out would be deleted.
    const untouched = (product?.translations ?? [])
      .filter((t) => t.language !== 'uk' && t.language !== 'en')
      .map((t) => ({ language: t.language, name: t.name, servingLabel: t.servingLabel }))

    const translations = [
      { language: 'uk', name: uk.name.trim(), servingLabel: uk.servingLabel.trim() || null },
      ...(en.name.trim() ? [{ language: 'en', name: en.name.trim(), servingLabel: en.servingLabel.trim() || null }] : []),
      ...untouched,
    ]

    return {
      groupSlug: groupSlug.trim() || null,
      caloriesPer100g: Number(calories),
      proteinPer100g: Number(protein),
      fatsPer100g: Number(fats),
      carbsPer100g: Number(carbs),
      servingWeightG: servingWeight.trim() === '' ? null : Number(servingWeight),
      isQuickPick,
      translations,
    }
  }

  const handleSave = async () => {
    setError(null)

    if (!uk.name.trim()) {
      setError('A Ukrainian name is required — it is the fallback for every other language')
      return
    }

    // An empty number field reads as `0` once it goes through `Number()`, and
    // a product silently saved as «0 kcal» is worse than one refused: it
    // corrupts every total it is ever counted into.
    const missing = ([['Calories', calories], ['Protein', protein], ['Carbs', carbs], ['Fats', fats]] as const)
      .filter(([, value]) => value.trim() === '' || !Number.isFinite(Number(value)))
      .map(([label]) => label)

    if (missing.length > 0) {
      setError(`These need a number: ${missing.join(', ')}`)
      return
    }

    try {
      const params = buildParams()
      if (product) await updateProduct({ id: product.id, params })
      else await createProduct(params)
      onSaved()
    } catch (e) {
      // The API refuses implausible numbers, unknown groups and duplicate
      // English names; its message names the field, so it is shown as it is.
      setError(e instanceof HttpError ? e.message : 'Could not save the product')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SheetHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <SheetTitle className="text-lg font-semibold text-text-primary">
            {product ? 'Edit Product' : 'New Product'}
          </SheetTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X size={16} />
          </Button>
        </div>
      </SheetHeader>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Names</h3>

        <Field label="Name (uk)">
          <Input value={uk.name} onChange={(e) => setUk({ ...uk, name: e.target.value })} placeholder="Помідори" />
        </Field>
        <Field label="Serving label (uk)">
          <Input
            value={uk.servingLabel}
            onChange={(e) => setUk({ ...uk, servingLabel: e.target.value })}
            placeholder="1 шт"
          />
        </Field>

        <Field
          label="Name (en)"
          hint="How a recipe CSV addresses this product — Tomatoes:250. Must be unique."
        >
          <Input value={en.name} onChange={(e) => setEn({ ...en, name: e.target.value })} placeholder="Tomatoes" />
        </Field>
        <Field label="Serving label (en)">
          <Input
            value={en.servingLabel}
            onChange={(e) => setEn({ ...en, servingLabel: e.target.value })}
            placeholder="1 medium"
          />
        </Field>
      </section>

      <Separator />

      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">Nutrition per 100 g</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Calories (kcal)">
            <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
          </Field>
          <Field label="Protein (g)">
            <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
          </Field>
          <Field label="Carbs (g)">
            <Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          </Field>
          <Field label="Fats (g)">
            <Input type="number" value={fats} onChange={(e) => setFats(e.target.value)} />
          </Field>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <Field label="Group slug" hint="Optional — must already exist, e.g. vegetables.">
          <Input value={groupSlug} onChange={(e) => setGroupSlug(e.target.value)} placeholder="vegetables" />
        </Field>
        <Field label="Serving weight (g)" hint="Weight of one piece, for products sold by the item.">
          <Input type="number" value={servingWeight} onChange={(e) => setServingWeight(e.target.value)} />
        </Field>

        <div className="flex items-center justify-between rounded-lg border border-border-default px-3 py-2.5">
          <div>
            <p className="text-sm text-text-primary">Quick pick</p>
            <p className="text-xs text-text-tertiary">Shown as a one-tap chip on the app&apos;s filter screen.</p>
          </div>
          <Switch checked={isQuickPick} onCheckedChange={setIsQuickPick} />
        </div>
      </section>

      {error && (
        <p className="text-sm text-error-default" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1" disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-text-tertiary mb-1 block">{label}</label>
      {children}
      {hint && <p className="text-xs text-text-tertiary mt-1">{hint}</p>}
    </div>
  )
}
