'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import type { Tag, TagKind } from '@/data'
import { Badge } from '@/shared/ui/components/badge'
import { Input } from '@/shared/ui/components/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/components/table'
import { useGetAllTags } from '@/state/domains/tag'

/**
 * A reference list, not an editor.
 *
 * These are three seeded dictionaries — categories, cuisines, diets — and the
 * mobile filter screen is built around exactly this set of chips (ADR-0006).
 * They arrive with migrations and change by migration, which is why there is
 * nothing to click here: a dish's taxonomy is set on the dish, in the recipe
 * form.
 */
const GROUPS: { kind: TagKind; title: string; note: string }[] = [
  { kind: 'category', title: 'Categories', note: 'One per dish' },
  { kind: 'cuisine', title: 'Cuisines', note: 'One per dish' },
  { kind: 'diet', title: 'Diets', note: 'Any number per dish' },
]

export function TagsPage() {
  const { tags, isLoading } = useGetAllTags()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDeferredValue(search)

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    if (!query) return tags
    return tags.filter(tag => tag.name.toLowerCase().includes(query) || tag.slug.includes(query))
  }, [tags, debouncedSearch])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">Tags</h1>
        <p className="text-sm text-text-secondary mt-1">
          {tags.length} across three dictionaries. Read-only — they ship with the database and are applied to a
          dish from the recipe form.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tags..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <p className="text-text-tertiary text-sm">Loading...</p>
      ) : (
        GROUPS.map(group => {
          const rows = filtered.filter(tag => tag.kind === group.kind)
          if (rows.length === 0) return null

          return <TagGroup key={group.kind} title={group.title} note={group.note} rows={rows} />
        })
      )}

      {!isLoading && filtered.length === 0 && <p className="text-text-tertiary text-sm">Nothing found</p>}
    </div>
  )
}

function TagGroup({ title, note, rows }: { title: string; note: string; rows: Tag[] }) {
  return (
    <section>
      <div className="flex items-baseline gap-2 mb-2">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text-primary">{title}</h2>
        <span className="text-xs text-text-tertiary">
          {rows.length} · {note}
        </span>
      </div>

      <div className="rounded-xl border border-border-default overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16" />
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(tag => (
              <TableRow key={tag.id}>
                <TableCell className="text-lg">{tag.emoji ?? ''}</TableCell>
                <TableCell className="font-medium text-text-primary">{tag.name}</TableCell>
                <TableCell>
                  {/* The slug is what a CSV import and the mobile filters refer
                      to, so it is the column an editor actually needs. */}
                  <Badge variant="outline" className="font-mono text-xs">
                    {tag.slug}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
