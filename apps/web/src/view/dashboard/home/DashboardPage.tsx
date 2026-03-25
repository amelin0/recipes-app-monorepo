'use client'

import Link from 'next/link'
import { useDashboardPage } from './useDashboardPage'
import { useTopFavorited } from '@/state/domains/dashboard'
import { Button } from '@/shared/ui/components/button'
import { Separator } from '@/shared/ui/components/separator'
import { Badge } from '@/shared/ui/components/badge'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Users, Globe, Languages, Heart, ArrowRight } from 'lucide-react'

const LANGUAGE_LABELS: Record<string, string> = {
  uk: 'Ukrainian', en: 'English', ru: 'Russian', es: 'Spanish', unknown: 'Not set',
}

const COUNTRY_LABELS: Record<string, string> = {
  UA: 'Ukraine', US: 'United States', GB: 'United Kingdom', DE: 'Germany',
  ES: 'Spain', FR: 'France', PL: 'Poland', CA: 'Canada', unknown: 'Not set',
}

export function DashboardPage() {
  const { days, setDays, stats, isLoading, periodOptions } = useDashboardPage()
  const { recipes: topFavorites, isLoading: favLoading } = useTopFavorited()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">
          Dashboard
        </h1>
        <p className="text-sm text-text-secondary mt-1">Overview of your platform</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Stats Card */}
        <div className="rounded-xl border border-border-default bg-bg-canvas p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-primary-default" />
              <h2 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-text-primary">
                New Registrations
              </h2>
            </div>
            <div className="flex gap-1">
              {periodOptions.map((opt) => (
                <Button
                  key={opt.days}
                  variant={days === opt.days ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDays(opt.days)}
                  className="text-xs h-7 px-2.5"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-3xl font-bold text-text-primary mb-4">
            {isLoading ? '—' : stats?.total ?? 0}
          </p>

          <div className="h-40 mb-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-text-tertiary text-sm">Loading...</div>
            ) : stats?.by_date.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.by_date} barSize={days <= 7 ? 24 : days <= 30 ? 8 : 4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border-default)', fontSize: 12 }} labelFormatter={(d) => new Date(d).toLocaleDateString()} />
                  <Bar dataKey="count" fill="var(--color-primary-default)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary text-sm">No registrations in this period</div>
            )}
          </div>

          <Separator className="mb-4" />

          <div className="grid grid-cols-2 gap-4">
            <DemoColumn icon={<Languages size={14} />} title="Languages" items={(stats?.by_language ?? []).map((i) => ({ label: LANGUAGE_LABELS[i.language] ?? i.language, count: i.count }))} loading={isLoading} />
            <DemoColumn icon={<Globe size={14} />} title="Countries" items={(stats?.by_country ?? []).map((i) => ({ label: COUNTRY_LABELS[i.country] ?? i.country, count: i.count }))} loading={isLoading} />
          </div>
        </div>

        {/* Top Favorites Card */}
        <div className="rounded-xl border border-border-default bg-bg-canvas p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart size={18} className="text-error-default" />
              <h2 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-text-primary">
                Top Favorited Recipes
              </h2>
            </div>
            <Link href="/favorite-statistics">
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                Favorite Statistics <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          {favLoading ? (
            <div className="flex items-center justify-center h-40 text-text-tertiary text-sm">Loading...</div>
          ) : topFavorites.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-text-tertiary text-sm">No favorites yet</div>
          ) : (
            <div className="space-y-3">
              {topFavorites.map((recipe, i) => (
                <div key={recipe.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-surface transition-colors">
                  <span className="text-sm font-bold text-text-tertiary w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{recipe.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{recipe.calories} kcal</Badge>
                      {recipe.demographics.by_language.slice(0, 2).map((l) => (
                        <span key={l.language} className="text-xs text-text-tertiary">
                          {LANGUAGE_LABELS[l.language] ?? l.language}: {l.count}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-error-default">
                    <Heart size={14} fill="currentColor" />
                    <span className="text-sm font-semibold">{recipe.favorites_count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DemoColumn({ icon, title, items, loading }: { icon: React.ReactNode; title: string; items: { label: string; count: number }[]; loading: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-text-tertiary">{icon}</span>
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{title}</p>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{item.label}</span>
            <span className="font-medium text-text-primary">{item.count}</span>
          </div>
        ))}
        {!items.length && !loading && <p className="text-xs text-text-tertiary">No data</p>}
      </div>
    </div>
  )
}
