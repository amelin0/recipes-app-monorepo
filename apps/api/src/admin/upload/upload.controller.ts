import type { Context } from 'hono'
import { supabaseAdmin } from '../../shared/supabase.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const AdminUploadController = {
  uploadRecipeImage: async (c: Context) => {
    try {
      const body = await c.req.parseBody()
      const file = body['file']

      if (!file || typeof file === 'string') {
        return error(c, 'File is required')
      }

      const ext = file.name?.split('.').pop() || 'jpg'
      const filename = `${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('recipe-images')
        .upload(filename, file, { contentType: file.type })
      if (uploadError) throw uploadError

      const { data: urlData } = supabaseAdmin.storage
        .from('recipe-images')
        .getPublicUrl(filename)

      return success(c, { url: urlData.publicUrl })
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Upload failed')
    }
  },
}
