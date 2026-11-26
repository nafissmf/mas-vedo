import { createResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const { respondentCode } = await createResponse(await readBody(event))
  return { ok: true, respondentCode }
})
