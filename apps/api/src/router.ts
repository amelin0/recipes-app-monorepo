import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { clientRouter } from './client/router.ts'
import { adminRouter } from './admin/router.ts'

const app = new Hono().basePath('/api')

app.use('*', cors())

app.route('/', clientRouter)
app.route('/admin', adminRouter)

app.get('/health', (c) => c.json({ status: 'ok' }))

export { app }
