import { app } from '../../../src/router.ts'

Deno.serve(app.fetch)
