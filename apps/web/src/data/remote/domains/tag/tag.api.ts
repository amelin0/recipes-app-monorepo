import { HttpService } from '@/shared/services'

import type { Tag } from './tag.types'

/**
 * Tags are **read-only**, and that is the model rather than a missing feature.
 *
 * What the panel calls a tag is one of three seeded dictionaries — categories,
 * cuisines and diets (ADR-0006). They ship with migrations because the mobile
 * filter screen is built around exactly those chips, so there is no create,
 * update, delete or assign: a dish's taxonomy is set on the dish, through
 * `categoryId` / `cuisineId` / `dietIds`.
 *
 * The V1 panel had full CRUD here against a flat `tags` table that no longer
 * exists. Decision of 2026-09-07: a flat façade for reading, typed fields for
 * writing.
 */
export const TagApi = {
  getAll: () => HttpService.get<Tag[]>('/tags'),
}
