import { requireAdmin } from '~/server/utils/admin-auth'
import { createResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  return createResponse(await readBody(event))
})
