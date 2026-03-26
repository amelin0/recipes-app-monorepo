import { Hono } from 'hono'
import { superAdminMiddleware } from '../../shared/middleware/auth.middleware.ts'
import { AdminUploadController } from './upload.controller.ts'

const uploadRoutes = new Hono()
uploadRoutes.post('/recipe-image', superAdminMiddleware, AdminUploadController.uploadRecipeImage)

export { uploadRoutes }
