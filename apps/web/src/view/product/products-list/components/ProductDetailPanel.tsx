'use client'

import { useState } from 'react'
import { SheetHeader, SheetTitle } from '@/shared/ui/components/sheet'
import { Badge } from '@/shared/ui/components/badge'
import { Button } from '@/shared/ui/components/button'
import { Input } from '@/shared/ui/components/input'
import { Separator } from '@/shared/ui/components/separator'
import { Pencil, X } from 'lucide-react'
import { useUpdateProduct } from '@/state/domains/product'
import type { ProductDetail } from '@/data'

interface Props {
  product: ProductDetail | null
  isLoading: boolean
  isVerifying: boolean
  onVerify: () => void
}

export function ProductDetailPanel({ product, isLoading, isVerifying, onVerify }: Props) {
  const [isEditing, setIsEditing] = useState(false)

  if (isLoading || !product) {
    return <div className="flex items-center justify-center h-64"><p className="text-text-tertiary text-sm">Loading...</p></div>
  }

  if (isEditing) {
    return <EditForm product={product} onCancel={() => setIsEditing(false)} onSaved={() => setIsEditing(false)} />
  }

  return (
    <div className="flex flex-col gap-6">
      <SheetHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={product.type === 'global' ? 'default' : 'outline'}>{product.type}</Badge>
            {product.is_verified && <Badge variant="default">Verified</Badge>}
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil size={14} className="mr-1.5" /> Edit
          </Button>
        </div>
        <SheetTitle className="text-lg font-semibold text-text-primary">
          {product.product_translations?.[0]?.name ?? 'Unnamed'}
        </SheetTitle>
      </SheetHeader>

      <Separator />

      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">Per 100g</h3>
        <div className="grid grid-cols-2 gap-3">
          <NutritionCard label="Calories" value={product.calories_per_100g} unit="kcal" color="text-macro-calories" />
          <NutritionCard label="Protein" value={product.proteins_per_100g} unit="g" color="text-macro-protein" />
          <NutritionCard label="Carbs" value={product.carbs_per_100g} unit="g" color="text-macro-carbs" />
          <NutritionCard label="Fats" value={product.fats_per_100g} unit="g" color="text-macro-fats" />
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">
          Translations ({product.product_translations?.length ?? 0})
        </h3>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {product.product_translations?.map((t) => (
            <div key={t.language} className="flex justify-between text-sm py-1.5 px-3 rounded-lg hover:bg-bg-surface">
              <span className="text-text-tertiary font-mono text-xs w-12">{t.language}</span>
              <span className="text-text-primary flex-1 ml-3">{t.name}</span>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {product.type === 'custom' && (
        <section>
          <Button variant={product.is_verified ? 'outline' : 'default'} onClick={onVerify} disabled={isVerifying} className="w-full">
            {isVerifying ? 'Updating...' : product.is_verified ? 'Remove Verification' : 'Verify Product'}
          </Button>
        </section>
      )}
    </div>
  )
}

function EditForm({ product, onCancel, onSaved }: { product: ProductDetail; onCancel: () => void; onSaved: () => void }) {
  const { updateProduct, isPending } = useUpdateProduct()

  const [calories, setCalories] = useState(String(product.calories_per_100g))
  const [proteins, setProteins] = useState(String(product.proteins_per_100g))
  const [carbs, setCarbs] = useState(String(product.carbs_per_100g))
  const [fats, setFats] = useState(String(product.fats_per_100g))
  const [translations, setTranslations] = useState(
    product.product_translations?.map((t) => ({ language: t.language, name: t.name })) ?? [],
  )

  const handleTranslationChange = (language: string, name: string) => {
    setTranslations((prev) => prev.map((t) => (t.language === language ? { ...t, name } : t)))
  }

  const handleSave = async () => {
    await updateProduct({
      id: product.id,
      params: {
        calories_per_100g: Number(calories),
        proteins_per_100g: Number(proteins),
        carbs_per_100g: Number(carbs),
        fats_per_100g: Number(fats),
        translations,
      },
    })
    onSaved()
  }

  return (
    <div className="flex flex-col gap-6">
      <SheetHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Edit Product</h2>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X size={16} />
          </Button>
        </div>
      </SheetHeader>

      <Separator />

      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">Nutrition per 100g</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-tertiary mb-1 block">Calories (kcal)</label>
            <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
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
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">
          Translations ({translations.length})
        </h3>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {translations.map((t) => (
            <div key={t.language} className="flex items-center gap-2">
              <span className="text-text-tertiary font-mono text-xs w-14 shrink-0">{t.language}</span>
              <Input
                value={t.name}
                onChange={(e) => handleTranslationChange(t.language, e.target.value)}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </section>

      <Separator />

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

function NutritionCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="rounded-lg border border-border-default p-3">
      <p className="text-text-tertiary text-xs">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>
        {value}<span className="text-xs font-normal text-text-tertiary ml-1">{unit}</span>
      </p>
    </div>
  )
}
