import type { RowDataPacket } from 'mysql2'
import { questions } from '~/shared/questions'
import { requireAdmin } from '~/server/utils/admin-auth'
import { db } from '~/server/utils/db'

type Values = number[]
const mean = (values: Values) => values.reduce((sum, value) => sum + value, 0) / values.length
const sampleVariance = (values: Values) => {
  if (values.length < 2) return 0
  const average = mean(values)
  return values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1)
}
const correlation = (a: Values, b: Values) => {
  if (a.length < 2) return 0
  const aMean = mean(a), bMean = mean(b)
  const numerator = a.reduce((sum, value, index) => sum + (value - aMean) * (b[index] - bMean), 0)
  const denominator = Math.sqrt(a.reduce((sum, value) => sum + (value - aMean) ** 2, 0) * b.reduce((sum, value) => sum + (value - bMean) ** 2, 0))
  return denominator ? numerator / denominator : 0
}
const round = (value: number) => Number(value.toFixed(3))

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const [rows] = await db().query<RowDataPacket[]>(`
    SELECT r.id AS responseId, a.question_key AS questionKey, a.score
    FROM responses r INNER JOIN answers a ON a.response_id = r.id
    ORDER BY r.id, a.question_key
  `)
  const answers = new Map<number, Record<string, number>>()
  for (const row of rows) {
    const response = answers.get(Number(row.responseId)) || {}
    response[row.questionKey] = Number(row.score)
    answers.set(Number(row.responseId), response)
  }

  const variables = [...new Map(questions.map((question) => [question.variableCode, { code: question.variableCode, name: question.variable }])).values()]
    .map((variable) => {
      const variableQuestions = questions.filter((question) => question.variableCode === variable.code)
      const respondents = [...answers.values()].filter((response) => variableQuestions.every((question) => Number.isFinite(response[question.key])))
      const itemValues = variableQuestions.map((question) => respondents.map((response) => response[question.key]))
      const totals = respondents.map((response) => variableQuestions.reduce((sum, question) => sum + response[question.key], 0))
      const itemVariances = itemValues.map(sampleVariance)
      const totalVariance = sampleVariance(totals)
      const alpha = variableQuestions.length > 1 && totalVariance > 0
        ? (variableQuestions.length / (variableQuestions.length - 1)) * (1 - itemVariances.reduce((sum, value) => sum + value, 0) / totalVariance)
        : 0
      // Estimasi measurement model berbasis korelasi indikator terhadap skor konstruk tanpa indikator tersebut.
      const loadings = itemValues.map((values, itemIndex) => correlation(values, totals.map((total, rowIndex) => total - values[rowIndex])))
      const squaredLoadings = loadings.map((loading) => loading ** 2)
      const loadingSum = loadings.reduce((sum, loading) => sum + loading, 0)
      const compositeReliability = loadings.length && (loadingSum ** 2 + squaredLoadings.reduce((sum, value) => sum + 1 - value, 0)) > 0
        ? loadingSum ** 2 / (loadingSum ** 2 + squaredLoadings.reduce((sum, value) => sum + 1 - value, 0)) : 0
      const ave = squaredLoadings.length ? mean(squaredLoadings) : 0
      const allScores = itemValues.flat()
      return {
        ...variable,
        respondents: respondents.length,
        indicators: variableQuestions.map((question, index) => ({
          key: question.key, indicator: question.indicator, text: question.text,
          mean: round(mean(itemValues[index]) || 0), sd: round(Math.sqrt(sampleVariance(itemValues[index]))),
          loading: round(loadings[index]), valid: loadings[index] >= 0.7
        })),
        mean: round(mean(allScores) || 0), sd: round(Math.sqrt(sampleVariance(allScores))),
        min: allScores.length ? Math.min(...allScores) : 0, max: allScores.length ? Math.max(...allScores) : 0,
        cronbachAlpha: round(alpha), compositeReliability: round(compositeReliability), ave: round(ave),
        reliable: alpha >= 0.7 && compositeReliability >= 0.7, convergentValid: ave >= 0.5
      }
    })
  return { respondents: answers.size, generatedAt: new Date().toISOString(), variables }
})
