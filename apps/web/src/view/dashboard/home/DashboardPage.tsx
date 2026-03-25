'use client'

import { useDashboardPage } from './useDashboardPage'
import { Button } from '@/shared/ui/components/button'
import { Separator } from '@/shared/ui/components/separator'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Users, Globe, Languages } from 'lucide-react'

const LANGUAGE_LABELS: Record<string, string> = {
  uk: 'Ukrainian', en: 'English', ru: 'Russian', es: 'Spanish', unknown: 'Not set',
}

const COUNTRY_LABELS: Record<string, string> = {
  UA: 'Ukraine', US: 'United States', GB: 'United Kingdom', DE: 'Germany',
  ES: 'Spain', FR: 'France', PL: 'Poland', CA: 'Canada', unknown: 'Not set',
}

export function DashboardPage() {
  const { days, setDays, stats, isLoading, periodOptions } = useDashboardPage()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">
          Dashboard
        </h1>
        <p className="text-sm text-text-secondary mt-1">Overview of your platform</p>
      </div>

      {/* Registration Stats Card */}
      <div className="rounded-xl border border-border-default bg-bg-canvas p-6 max-w-[520px]">
        {/* Header */}
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

        {/* Total */}
        <p className="text-3xl font-bold text-text-primary mb-4">
          {isLoading ? '—' : stats?.total ?? 0}
        </p>

        {/* Chart */}
        <div className="h-40 mb-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
              Loading...
            </div>
          ) : stats?.by_date.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.by_date} barSize={days <= 7 ? 24 : days <= 30 ? 8 : 4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid var(--color-border-default)',
                    fontSize: 12,
                  }}
                  labelFormatter={(d) => new Date(d).toLocaleDateString()}
                />
                <Bar dataKey="count" fill="var(--color-primary-default)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
              No registrations in this period
            </div>
          )}
        </div>

        <Separator className="mb-4" />

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          {/* Languages */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Languages size={14} className="text-text-tertiary" />
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Languages</p>
            </div>
            <div className="space-y-1.5">
              {(stats?.by_language ?? []).map((item) => (
                <div key={item.language} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">
                    {LANGUAGE_LABELS[item.language] ?? item.language}
                  </span>
                  <span className="font-medium text-text-primary">{item.count}</span>
                </div>
              ))}
              {!stats?.by_language?.length && !isLoading && (
                <p className="text-xs text-text-tertiary">No data</p>
              )}
            </div>
          </div>

          {/* Countries */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Globe size={14} className="text-text-tertiary" />
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Countries</p>
            </div>
            <div className="space-y-1.5">
              {(stats?.by_country ?? []).map((item) => (
                <div key={item.country} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">
                    {COUNTRY_LABELS[item.country] ?? item.country}
                  </span>
                  <span className="font-medium text-text-primary">{item.count}</span>
                </div>
              ))}
              {!stats?.by_country?.length && !isLoading && (
                <p className="text-xs text-text-tertiary">No data</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
