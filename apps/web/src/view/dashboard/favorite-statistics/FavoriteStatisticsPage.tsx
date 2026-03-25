'use client'

import { useFavoriteStatisticsPage } from './useFavoriteStatisticsPage'
import { Button } from '@/shared/ui/components/button'
import { Badge } from '@/shared/ui/components/badge'
import { Separator } from '@/shared/ui/components/separator'
import { Heart, ChevronLeft, ChevronRight, Globe, Languages } from 'lucide-react'

const LANGUAGE_LABELS: Record<string, string> = {
  uk: 'Ukrainian', en: 'English', ru: 'Russian', es: 'Spanish', unknown: 'Not set',
}

const COUNTRY_LABELS: Record<string, string> = {
  UA: 'Ukraine', US: 'United States', GB: 'United Kingdom', DE: 'Germany',
  ES: 'Spain', FR: 'France', PL: 'Poland', CA: 'Canada', unknown: 'Not set',
}

export function FavoriteStatisticsPage() {
  const { recipes, total, page, totalPages, isLoading, setPage } = useFavoriteStatisticsPage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">
          Favorite Statistics
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {total} recipe{total !== 1 ? 's' : ''} with favorites
        </p>
      </div>

      {isLoading ? (
        <div className="text-text-tertiary text-sm py-12 text-center">Loading...</div>
      ) : recipes.length === 0 ? (
        <div className="text-text-tertiary text-sm py-12 text-center">No favorites data yet</div>
      ) : (
        <div className="space-y-4">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="rounded-xl border border-border-default bg-bg-canvas p-5">
              {/* Recipe header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-[family-name:var(--font-heading)] text-base font-semibold text-text-primary">
                    {recipe.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{recipe.calories} kcal</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-error-default">
                  <Heart size={18} fill="currentColor" />
                  <span className="text-lg font-bold">{recipe.favorites_count}</span>
                </div>
              </div>

              <Separator className="mb-4" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Demographics */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Languages size={14} className="text-text-tertiary" />
                    <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Languages</p>
                  </div>
                  <div className="space-y-1">
                    {recipe.demographics.by_language.map((l) => (
                      <div key={l.language} className="flex justify-between text-sm">
                        <span className="text-text-secondary">{LANGUAGE_LABELS[l.language] ?? l.language}</span>
                        <span className="font-medium text-text-primary">{l.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Globe size={14} className="text-text-tertiary" />
                    <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Countries</p>
                  </div>
                  <div className="space-y-1">
                    {recipe.demographics.by_country.map((c) => (
                      <div key={c.country} className="flex justify-between text-sm">
                        <span className="text-text-secondary">{COUNTRY_LABELS[c.country] ?? c.country}</span>
                        <span className="font-medium text-text-primary">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Users who favorited */}
                <div>
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Users</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {recipe.users.map((u) => (
                      <div key={u.id} className="text-sm">
                        <p className="text-text-primary font-medium">{u.first_name} {u.last_name}</p>
                        <p className="text-text-tertiary text-xs">{u.email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
