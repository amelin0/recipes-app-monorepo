import { supabaseAdmin } from '../supabase.ts'

interface ProductFilters {
  search?: string
  type?: string
  page?: number
  limit?: number
}

interface CreateCustomProductParams {
  name: string
  proteins_per_100g: number
  carbs_per_100g: number
  fats_per_100g: number
  calories_per_100g?: number
}

const calculateCalories = (p: number, c: number, f: number) =>
  Math.round((p * 4 + c * 4 + f * 9) * 100) / 100

export const ProductService = {
  search: async (query: string, language: string, page = 1, limit = 20) => {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabaseAdmin
      .from('products')
      .select(`
        id, type, calories_per_100g, proteins_per_100g, carbs_per_100g, fats_per_100g, is_verified,
        product_translations!inner(name)
      `, { count: 'exact' })
      .eq('product_translations.language', language)
      .ilike('product_translations.name', `%${query}%`)
      .order('is_verified', { ascending: false })
      .order('type')
      .range(from, to)
    if (error) throw error

    return {
      data: (data || []).map((p: any) => ({
        id: p.id,
        name: p.product_translations?.[0]?.name ?? '',
        type: p.type,
        calories_per_100g: p.calories_per_100g,
        proteins_per_100g: p.proteins_per_100g,
        carbs_per_100g: p.carbs_per_100g,
        fats_per_100g: p.fats_per_100g,
        is_verified: p.is_verified,
      })),
      total: count ?? 0,
      page,
      limit,
    }
  },

  getAll: async (filters: ProductFilters, language: string) => {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('products')
      .select(`
        id, type, calories_per_100g, proteins_per_100g, carbs_per_100g, fats_per_100g, is_verified, created_by, created_at,
        product_translations!inner(name)
      `, { count: 'exact' })
      .eq('product_translations.language', language)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (filters.search) {
      query = query.ilike('product_translations.name', `%${filters.search}%`)
    }
    if (filters.type) {
      query = query.eq('type', filters.type)
    }

    const { data, error, count } = await query
    if (error) throw error

    return {
      data: (data || []).map((p: any) => ({
        id: p.id,
        name: p.product_translations?.[0]?.name ?? '',
        type: p.type,
        calories_per_100g: p.calories_per_100g,
        proteins_per_100g: p.proteins_per_100g,
        carbs_per_100g: p.carbs_per_100g,
        fats_per_100g: p.fats_per_100g,
        is_verified: p.is_verified,
        created_at: p.created_at,
      })),
      total: count ?? 0,
      page,
      limit,
    }
  },

  getById: async (id: string) => {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        product_translations(language, name)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  createCustom: async (userId: string, language: string, params: CreateCustomProductParams) => {
    const calories = params.calories_per_100g ?? calculateCalories(
      params.proteins_per_100g,
      params.carbs_per_100g,
      params.fats_per_100g,
    )

    const { data: product, error: pError } = await supabaseAdmin
      .from('products')
      .insert({
        type: 'custom',
        calories_per_100g: calories,
        proteins_per_100g: params.proteins_per_100g,
        carbs_per_100g: params.carbs_per_100g,
        fats_per_100g: params.fats_per_100g,
        created_by: userId,
        is_verified: false,
      })
      .select()
      .single()
    if (pError) throw pError

    const { error: tError } = await supabaseAdmin
      .from('product_translations')
      .insert({
        product_id: product.id,
        language,
        name: params.name,
      })
    if (tError) throw tError

    return { ...product, name: params.name }
  },

  update: async (id: string, params: {
    calories_per_100g: number
    proteins_per_100g: number
    carbs_per_100g: number
    fats_per_100g: number
    translations: { language: string; name: string }[]
  }) => {
    const { error: pError } = await supabaseAdmin
      .from('products')
      .update({
        calories_per_100g: params.calories_per_100g,
        proteins_per_100g: params.proteins_per_100g,
        carbs_per_100g: params.carbs_per_100g,
        fats_per_100g: params.fats_per_100g,
      })
      .eq('id', id)
    if (pError) throw pError

    for (const t of params.translations) {
      const { error: tError } = await supabaseAdmin
        .from('product_translations')
        .upsert(
          { product_id: id, language: t.language, name: t.name },
          { onConflict: 'product_id,language' },
        )
      if (tError) throw tError
    }

    return ProductService.getById(id)
  },

  verify: async (id: string, verified: boolean) => {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ is_verified: verified })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
