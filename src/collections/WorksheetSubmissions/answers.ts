import type { ValidationFieldError } from 'payload'

import { normalizeText } from '../Worksheets/questions'

export const ANSWER_MAX_LENGTH = 5000

export type SnapshotQuestion = {
  key: string
  label: string
  required: boolean
}

export type Answer = {
  questionKey: string
  value: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Kiểm tra câu trả lời client gửi lên so với câu hỏi của worksheet gốc.
 * Câu trả lời trống (kể cả chỉ có khoảng trắng) được coi là bỏ qua và không được lưu.
 */
export const normalizeAnswers = (
  input: unknown,
  questions: SnapshotQuestion[],
): { answers: Answer[]; errors: ValidationFieldError[] } => {
  const errors: ValidationFieldError[] = []
  const answers: Answer[] = []

  if (input !== undefined && input !== null && !Array.isArray(input)) {
    return { answers, errors: [{ path: 'answers', message: 'Câu trả lời phải là một danh sách.' }] }
  }

  const questionKeys = new Set(questions.map((question) => question.key))
  const seenKeys = new Set<string>()

  ;(input ?? []).forEach((item: unknown, index: number) => {
    const path = `answers.${index}`

    if (!isRecord(item) || typeof item.questionKey !== 'string') {
      errors.push({ path: `${path}.questionKey`, message: 'Thiếu mã câu hỏi.' })
      return
    }

    const questionKey = item.questionKey

    if (!questionKeys.has(questionKey)) {
      errors.push({ path: `${path}.questionKey`, message: `Mã câu hỏi "${questionKey}" không thuộc worksheet.` })
      return
    }

    if (seenKeys.has(questionKey)) {
      errors.push({ path: `${path}.questionKey`, message: `Mã câu hỏi "${questionKey}" bị trả lời nhiều lần.` })
      return
    }

    seenKeys.add(questionKey)

    if (item.value !== undefined && item.value !== null && typeof item.value !== 'string') {
      errors.push({ path: `${path}.value`, message: 'Câu trả lời phải là văn bản.' })
      return
    }

    const value = typeof item.value === 'string' ? normalizeText(item.value) : ''

    if (value.length > ANSWER_MAX_LENGTH) {
      errors.push({ path: `${path}.value`, message: `Câu trả lời tối đa ${ANSWER_MAX_LENGTH} ký tự.` })
      return
    }

    if (value !== '') {
      answers.push({ questionKey, value })
    }
  })

  const answeredKeys = new Set(answers.map((answer) => answer.questionKey))
  const missing = questions
    .filter((question) => question.required && !answeredKeys.has(question.key))
    .map((question) => question.key)

  if (missing.length > 0) {
    errors.push({ path: 'answers', message: `Chưa trả lời câu bắt buộc: ${missing.join(', ')}.` })
  }

  return { answers, errors }
}
