/**
 * Moved here from `recipe.types` — it never belonged there, and the recipe
 * contract was the only thing importing it.
 *
 * ⚠️ There is no `/languages` endpoint on the admin API. This domain is V1
 * shape kept for the screens that reference it; see `../README.md`.
 */
export interface Language {
  code: string
  name: string
  native_name: string
  is_rtl: boolean
  tier: number
  is_active: boolean
}
