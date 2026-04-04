'use client'

import { useState, useEffect } from 'react'
import { SheetHeader, SheetTitle } from '@/shared/ui/components/sheet'
import { Button } from '@/shared/ui/components/button'
import { Input } from '@/shared/ui/components/input'
import { Separator } from '@/shared/ui/components/separator'
import { Switch } from '@/shared/ui/components/switch'
import { X } from 'lucide-react'
import { useCreateTag, useUpdateTag } from '@/state/domains/tag'
import { useGetLanguages } from '@/state/domains/language'
import type { TagFull } from '@/data'

interface Props {
  tag: TagFull | null // null = create mode
  onClose: () => void
}

export function TagDetailPanel({ tag, onClose }: Props) {
  const isCreate = !tag
  const { createTag, isPending: isCreating } = useCreateTag()
  const { updateTag, isPending: isUpdating } = useUpdateTag()
  const { languages } = useGetLanguages()
  const isPending = isCreating || isUpdating

  const [translations, setTranslations] = useState<{ language: string; name: string; enabled: boolean }[]>([])

  useEffect(() => {
    if (languages.length === 0) return
    const existingMap = new Map(
      (tag?.tag_translations ?? []).map((t) => [t.language, t.name]),
    )
    setTranslations(
      languages.map((l) => ({
        language: l.code,
        name: existingMap.get(l.code) ?? '',
        enabled: isCreate ? l.code === 'uk' : existingMap.has(l.code),
      })),
    )
  }, [languages.length, tag?.id])

  const handleSave = async () => {
    const enabled = translations
      .filter((t) => t.enabled && t.name.trim())
      .map(({ language, name }) => ({ language, name }))
    if (enabled.length === 0) return

    if (isCreate) {
      await createTag(enabled)
    } else {
      await updateTag({ id: tag.id, translations: enabled })
    }
    onClose()
  }

  const handleToggle = (lang: string) => {
    setTranslations((prev) => prev.map((t) => (t.language === lang ? { ...t, enabled: !t.enabled } : t)))
  }

  const handleNameChange = (lang: string, name: string) => {
    setTranslations((prev) => prev.map((t) => (t.language === lang ? { ...t, name } : t)))
  }

  const enabledCount = translations.filter((t) => t.enabled).length

  return (
    <div className="flex flex-col gap-6">
      <SheetHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <SheetTitle className="text-lg font-semibold text-text-primary">
            {isCreate ? 'New Tag' : 'Edit Tag'}
          </SheetTitle>
          <Button variant="ghost" size="sm" onClick={onClose}><X size={16} /></Button>
        </div>
        {!isCreate && (
          <p className="text-xs text-text-tertiary">Used in {tag.recipe_count} recipe{tag.recipe_count !== 1 ? 's' : ''}</p>
        )}
      </SheetHeader>

      <Separator />

      <section>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
          Translations ({enabledCount}/{translations.length})
        </h3>
        <p className="text-xs text-text-tertiary mb-3">
          Enable languages and provide the tag name in each.
        </p>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {translations.map((t) => (
            <div key={t.language} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${!t.enabled ? 'opacity-50' : ''}`}>
              <Switch checked={t.enabled} onCheckedChange={() => handleToggle(t.language)} />
              <span className="text-text-tertiary font-mono text-xs w-14 shrink-0">{t.language}</span>
              <Input
                value={t.name}
                onChange={(e) => handleNameChange(t.language, e.target.value)}
                disabled={!t.enabled}
                placeholder="Tag name..."
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1" disabled={isPending}>Cancel</Button>
        <Button onClick={handleSave} className="flex-1" disabled={isPending}>
          {isPending ? (isCreate ? 'Creating...' : 'Saving...') : (isCreate ? 'Create' : 'Save')}
        </Button>
      </div>
    </div>
  )
}
