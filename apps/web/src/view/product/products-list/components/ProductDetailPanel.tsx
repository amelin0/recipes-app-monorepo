'use client'

import { useState } from 'react'
import { SheetHeader, SheetTitle } from '@/shared/ui/components/sheet'
import { Badge } from '@/shared/ui/components/badge'
import { Button } from '@/shared/ui/components/button'
import { Separator } from '@/shared/ui/components/separator'
import { Pencil } from 'lucide-react'
import { ProductForm } from './ProductForm'
import type { ProductDetail } from '@/data'

interface Props {
  product: ProductDetail | null
  isLoading: boolean
  isVerifying: boolean
  isArchiving: boolean
  onVerify: () => void
  onArchive: () => void
}

export function ProductDetailPanel({ product, isLoading, isVerifying, isArchiving, onVerify, onArchive }: Props) {
  const [isEditing, setIsEditing] = useState(false)

  if (isLoading || !product) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-tertiary text-sm">Loading...</p>
      </div>
    )
  }

  if (isEditing) {
    return <ProductForm product={product} onCancel={() => setIsEditing(false)} onSaved={() => setIsEditing(false)} />
  }

  const isArchived = product.archivedAt !== null

  return (
    <div className="flex flex-col gap-6">
      <SheetHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={product.source === 'global' ? 'default' : 'outline'}>{product.source}</Badge>
            {product.isVerified && <Badge variant="default">Verified</Badge>}
            {product.isQuickPick && <Badge variant="outline">Quick pick</Badge>}
            {isArchived && <Badge variant="outline">Archived</Badge>}
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil size={14} className="mr-1.5" /> Edit
          </Button>
        </div>
        <SheetTitle className="text-lg font-semibold text-text-primary">{product.name}</SheetTitle>
        {product.groupSlug && <p className="text-xs text-text-tertiary">{product.groupSlug}</p>}
      </SheetHeader>

      <Separator />

      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">Per 100 g</h3>
        <div className="grid grid-cols-2 gap-3">
          <NutritionCard label="Calories" value={product.caloriesPer100g} unit="kcal" color="text-macro-calories" />
          <NutritionCard label="Protein" value={product.proteinPer100g} unit="g" color="text-macro-protein" />
          <NutritionCard label="Carbs" value={product.carbsPer100g} unit="g" color="text-macro-carbs" />
          <NutritionCard label="Fats" value={product.fatsPer100g} unit="g" color="text-macro-fats" />
        </div>
        {product.servingWeightG !== null && (
          <p className="text-xs text-text-tertiary mt-3">One serving weighs {product.servingWeightG} g</p>
        )}
      </section>

      <Separator />

      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">
          Translations ({product.translations.length})
        </h3>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {product.translations.map((t) => (
            <div key={t.language} className="flex justify-between text-sm py-1.5 px-3 rounded-lg hover:bg-bg-surface">
              <span className="text-text-tertiary font-mono text-xs w-12">{t.language}</span>
              <span className="text-text-primary flex-1 ml-3">{t.name}</span>
              {t.servingLabel && <span className="text-text-tertiary text-xs">{t.servingLabel}</span>}
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        {/* Verifying promotes a user's product into the shared catalogue, so it
            is offered only while the product still belongs to someone. */}
        {product.source === 'custom' && (
          <div>
            <Button
              variant={product.isVerified ? 'outline' : 'default'}
              onClick={onVerify}
              disabled={isVerifying}
              className="w-full"
            >
              {isVerifying ? 'Updating...' : product.isVerified ? 'Remove Verification' : 'Verify Product'}
            </Button>
            <p className="text-xs text-text-tertiary mt-1.5">
              Verifying moves this product into the shared catalogue — it becomes ours and visible to everyone.
            </p>
          </div>
        )}

        <div>
          <Button variant="outline" onClick={onArchive} disabled={isArchiving} className="w-full">
            {isArchiving ? 'Updating...' : isArchived ? 'Restore to catalogue' : 'Remove from catalogue'}
          </Button>
          <p className="text-xs text-text-tertiary mt-1.5">
            {isArchived
              ? 'Restoring brings it back to search, here and in the app.'
              : `Hides it from search here and in the app. ${describeUsage(product.usedInRecipes)}`}
          </p>
        </div>
      </section>
    </div>
  )
}

/** Create mode: the same form, opened from the page's own sheet. */
export function ProductCreatePanel({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  return <ProductForm onCancel={onCancel} onSaved={onCreated} />
}

/** What the editor risks: the dishes that reference it stay intact regardless. */
function describeUsage(usedInRecipes: number): string {
  if (usedInRecipes === 0) return 'No catalogue dish uses it.'
  return `${usedInRecipes} dish${usedInRecipes === 1 ? '' : 'es'} using it stay${usedInRecipes === 1 ? 's' : ''} intact.`
}

function NutritionCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="rounded-lg border border-border-default p-3">
      <p className="text-text-tertiary text-xs">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>
        {value}
        <span className="text-xs font-normal text-text-tertiary ml-1">{unit}</span>
      </p>
    </div>
  )
}
