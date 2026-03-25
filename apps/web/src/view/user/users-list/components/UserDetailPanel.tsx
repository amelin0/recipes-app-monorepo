'use client'

import { SheetHeader, SheetTitle } from '@/shared/ui/components/sheet'
import { Badge } from '@/shared/ui/components/badge'
import { Button } from '@/shared/ui/components/button'
import { Separator } from '@/shared/ui/components/separator'
import { LANGUAGE_LABELS, COUNTRY_LABELS } from '../constants'
import type { UserDetail } from '@/data'

interface UserDetailPanelProps {
  user: UserDetail | null
  isLoading: boolean
  isBlocking: boolean
  onBlock: () => void
}

export function UserDetailPanel({ user, isLoading, isBlocking, onBlock }: UserDetailPanelProps) {
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-tertiary text-sm">Loading...</p>
      </div>
    )
  }

  const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <SheetHeader className="flex-row items-center gap-4 space-y-0">
        <div className="w-14 h-14 rounded-full bg-primary-subtle flex items-center justify-center shrink-0">
          <span className="text-base font-semibold text-primary-on-subtle">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <SheetTitle className="text-xl font-semibold text-text-primary">
            {user.first_name} {user.last_name}
          </SheetTitle>
          <p className="text-sm text-text-tertiary">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={user.is_blocked ? 'destructive' : 'default'}>
            {user.is_blocked ? 'Blocked' : 'Active'}
          </Badge>
        </div>
      </SheetHeader>

      <Separator />

      {/* Basic Info */}
      <section>
        <h3 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-text-primary mb-4">
          Details
        </h3>
        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
          <InfoRow label="Language" value={LANGUAGE_LABELS[user.language] ?? user.language} />
          <InfoRow label="Metric System" value={user.metric_system === 'METRIC' ? 'Metric (kg, cm)' : 'Imperial (lbs, ft)'} />
          <InfoRow label="Gender" value={user.gender ?? '—'} />
          <InfoRow label="Weight" value={user.weight_kg ? `${user.weight_kg} kg` : '—'} />
          <InfoRow label="Country" value={user.country ? (COUNTRY_LABELS[user.country] ?? user.country) : '—'} />
          <InfoRow label="Registered" value={new Date(user.created_at).toLocaleDateString()} />
        </div>
      </section>

      {/* Nutrition Goal */}
      {user.nutrition_goal && (
        <>
          <Separator />
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-text-primary">
                Nutrition Goal
              </h3>
              {user.nutrition_goal.is_auto_calculated && (
                <Badge variant="outline" className="text-xs">Auto</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MacroCard label="Calories" value={`${user.nutrition_goal.daily_calories}`} unit="kcal" color="text-macro-calories" />
              <MacroCard label="Protein" value={`${user.nutrition_goal.daily_proteins_g}`} unit="g" color="text-macro-protein" />
              <MacroCard label="Carbs" value={`${user.nutrition_goal.daily_carbs_g}`} unit="g" color="text-macro-carbs" />
              <MacroCard label="Fats" value={`${user.nutrition_goal.daily_fats_g}`} unit="g" color="text-macro-fats" />
            </div>
          </section>
        </>
      )}

      {/* Weight History */}
      {user.weight_history.length > 0 && (
        <>
          <Separator />
          <section>
            <h3 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-text-primary mb-4">
              Weight History
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {user.weight_history.map((entry) => (
                <div key={entry.recorded_at} className="flex justify-between text-sm py-2 px-3 rounded-lg hover:bg-bg-surface">
                  <span className="text-text-secondary">
                    {new Date(entry.recorded_at).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-text-primary">{entry.weight_kg} kg</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <Separator />

      {/* Actions */}
      <section>
        <Button
          variant={user.is_blocked ? 'default' : 'destructive'}
          onClick={onBlock}
          disabled
          className="w-full"
        >
          {user.is_blocked ? 'Unblock User' : 'Block User'}
        </Button>
      </section>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-text-tertiary text-xs mb-0.5">{label}</p>
      <p className="text-text-primary font-medium capitalize">{value}</p>
    </div>
  )
}

function MacroCard({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="rounded-lg border border-border-default p-4">
      <p className="text-text-tertiary text-xs mb-1">{label}</p>
      <p className={`text-xl font-semibold ${color}`}>
        {value}<span className="text-xs font-normal text-text-tertiary ml-1">{unit}</span>
      </p>
    </div>
  )
}
