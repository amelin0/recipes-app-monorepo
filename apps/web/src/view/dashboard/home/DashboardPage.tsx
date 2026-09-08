'use client'

import Link from 'next/link'
import { useDashboardPage } from './useDashboardPage'
import { languageLabel } from '../constants'
import { Button } from '@/shared/ui/components/button'
import { Badge } from '@/shared/ui/components/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, Languages, Inbox, AlertTriangle, BookOpen, Carrot, ArrowRight, ShieldOff, CreditCard } from 'lucide-react'

export function DashboardPage() {
  const { days, setDays, overview, isLoading, periodOptions } = useDashboardPage()

  const registrations = overview?.registrations
  const queues = overview?.queues

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">What is growing, and what is waiting</p>
      </div>

      {/* The only part of this screen that changes what anybody does today. */}
      {(queues?.newTickets || queues?.overdueDeletions) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {queues.newTickets > 0 && (
            <SignalCard
              href="/support-messages/?status=new"
              icon={<Inbox size={18} className="text-primary-default" />}
              count={queues.newTickets}
              label={`ticket${queues.newTickets === 1 ? '' : 's'} nobody has looked at`}
            />
          )}
          {queues.overdueDeletions > 0 && (
            <SignalCard
              href="/users/?deletion=overdue"
              icon={<AlertTriangle size={18} className="text-error-default" />}
              count={queues.overdueDeletions}
              label={`deletion request${queues.overdueDeletions === 1 ? '' : 's'} past the grace period`}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations */}
        <div className="rounded-xl border border-border-default bg-bg-canvas p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-primary-default" />
              <h2 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-text-primary">
                New registrations
              </h2>
            </div>
            <div className="flex gap-1">
              {periodOptions.map((option) => (
                <Button
                  key={option.days}
                  variant={days === option.days ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDays(option.days)}
                  className="text-xs h-7 px-2.5"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-3xl font-bold text-text-primary mb-4">
            {isLoading && !registrations ? '—' : (registrations?.total ?? 0)}
          </p>

          <div className="h-40">
            {registrations?.byDate.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={registrations.byDate} barSize={days <= 7 ? 24 : days <= 30 ? 8 : 4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    }
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
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border-default)', fontSize: 12 }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Bar dataKey="count" fill="var(--color-primary-default)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary text-sm">Loading...</div>
            )}
          </div>
        </div>

        {/* Accounts */}
        <div className="rounded-xl border border-border-default bg-bg-canvas p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Languages size={18} className="text-primary-default" />
            <h2 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-text-primary">
              Accounts
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Stat label="Total" value={overview?.users.total} />
            <Stat label="Subscribed" value={overview?.users.withActiveSubscription} icon={<CreditCard size={12} />} />
            <Stat label="Blocked" value={overview?.users.blocked} icon={<ShieldOff size={12} />} />
          </div>

          <div>
            <p className="text-xs text-text-tertiary mb-2">By language</p>
            <div className="space-y-1.5">
              {(registrations?.byLanguage ?? []).map((row) => (
                <div key={row.language ?? 'unset'} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{languageLabel(row.language)}</span>
                  <span className="text-text-primary font-medium">{row.count}</span>
                </div>
              ))}
              {registrations?.byLanguage.length === 0 && (
                <p className="text-sm text-text-tertiary">No accounts yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Catalogue */}
      <div className="rounded-xl border border-border-default bg-bg-canvas p-6">
        <h2 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-text-primary mb-4">
          Catalogue
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CatalogueCard
            href="/recipes/"
            icon={<BookOpen size={16} className="text-primary-default" />}
            label="Dishes"
            value={overview?.catalogue.recipes}
          />
          <CatalogueCard
            href="/products/"
            icon={<Carrot size={16} className="text-primary-default" />}
            label="Products"
            value={overview?.catalogue.products}
          />
          <CatalogueCard
            href="/products/"
            icon={<Carrot size={16} className="text-macro-carbs" />}
            label="Awaiting verification"
            value={overview?.catalogue.unverifiedCustomProducts}
          />
        </div>
      </div>
    </div>
  )
}

function SignalCard({
  href,
  icon,
  count,
  label,
}: {
  href: string
  icon: React.ReactNode
  count: number
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-canvas p-4 hover:bg-bg-surface transition-colors"
    >
      {icon}
      <div className="flex-1">
        <p className="text-lg font-semibold text-text-primary">{count}</p>
        <p className="text-xs text-text-secondary">{label}</p>
      </div>
      <ArrowRight size={16} className="text-icon-default" />
    </Link>
  )
}

function Stat({ label, value, icon }: { label: string; value: number | undefined; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border-default p-3">
      <p className="flex items-center gap-1 text-xs text-text-tertiary">
        {icon}
        {label}
      </p>
      <p className="text-lg font-semibold text-text-primary">{value ?? '—'}</p>
    </div>
  )
}

function CatalogueCard({
  href,
  icon,
  label,
  value,
}: {
  href: string
  icon: React.ReactNode
  label: string
  value: number | undefined
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border-default p-4 hover:bg-bg-surface transition-colors"
    >
      {icon}
      <div>
        <p className="text-lg font-semibold text-text-primary">{value ?? '—'}</p>
        <p className="text-xs text-text-secondary">{label}</p>
      </div>
      {value === 0 && (
        <Badge variant="outline" className="ml-auto text-xs">
          empty
        </Badge>
      )}
    </Link>
  )
}
