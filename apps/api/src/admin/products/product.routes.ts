import { Hono } from 'hono'
import { AdminProductController } from './product.controller.ts'

const productRoutes = new Hono()

productRoutes.get('/', AdminProductController.getAll)
productRoutes.get('/:id', AdminProductController.getById)
productRoutes.put('/:id', AdminProductController.update)
productRoutes.patch('/:id/verify', AdminProductController.verify)

export { productRoutes }
