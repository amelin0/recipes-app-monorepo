'use client'

import { useFavoriteStatisticsPage } from './useFavoriteStatisticsPage'
import { languageLabel } from '../constants'
import { Button } from '@/shared/ui/components/button'
import { Badge } from '@/shared/ui/components/badge'
import { Heart, ChevronLeft, ChevronRight, Languages } from 'lucide-react'

export function FavoriteStatisticsPage() {
  const { recipes, total, page, totalPages, isLoading, setPage } = useFavoriteStatisticsPage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">
          Favourite statistics
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {total} dish{total !== 1 ? 'es' : ''} somebody keeps
        </p>
      </div>

      {isLoading && recipes.length === 0 ? (
        <div className="text-text-tertiary text-sm py-12 text-center">Loading...</div>
      ) : recipes.length === 0 ? (
        <div className="text-text-tertiary text-sm py-12 text-center">Nobody has saved a dish yet</div>
      ) : (
        <div className="space-y-4">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="rounded-xl border border-border-default bg-bg-canvas p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-[family-name:var(--font-heading)] text-base font-semibold text-text-primary">
                    {recipe.name}
                  </h3>
                  <Badge variant="outline" className="text-xs mt-1">
                    {recipe.calories} kcal
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-error-default">
                  <Heart size={16} />
                  <span className="text-lg font-semibold">{recipe.favorites}</span>
                </div>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs text-text-tertiary mb-2">
                  <Languages size={12} /> By language
                </p>
                <div className="flex flex-wrap gap-2">
                  {recipe.byLanguage.map((row) => (
                    <Badge key={row.language ?? 'unset'} variant="outline" className="text-xs">
                      {languageLabel(row.language)}: {row.count}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Who saved it is deliberately absent: what a person keeps is
                  their own business, and the editorial question is «what
                  works», not «who liked it». */}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-tertiary">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
