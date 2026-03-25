import { Hono } from 'hono'
import { ClientSupportController } from './support.controller.ts'

const supportRoutes = new Hono()
supportRoutes.post('/', ClientSupportController.create)

export { supportRoutes }
