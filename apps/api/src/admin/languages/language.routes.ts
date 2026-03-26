import { Hono } from 'hono'
import { AdminLanguageController } from './language.controller.ts'

const languageRoutes = new Hono()
languageRoutes.get('/', AdminLanguageController.getAll)

export { languageRoutes }
