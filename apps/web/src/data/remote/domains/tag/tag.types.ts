export interface TagFull {
  id: string
  created_at: string
  tag_translations: { language: string; name: string }[]
  recipe_count: number
}
