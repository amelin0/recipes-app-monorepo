import { Hono } from 'hono'
import { ClientProductController } from './product.controller.ts'

const productRoutes = new Hono()

productRoutes.get('/search', ClientProductController.search)
productRoutes.post('/', ClientProductController.createCustom)

export { productRoutes }
