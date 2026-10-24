// Mã câu hỏi (`key`) là định danh ổn định để bài nộp sau này gắn câu trả lời với câu hỏi,
// nên chỉ cho phép chữ thường không dấu, số, "-" và "_".
export const QUESTION_KEY_PATTERN = /^[a-z0-9_-]+$/

export const QUESTION_KEY_MAX_LENGTH = 64

export const INVALID_QUESTION_KEY_MESSAGE =
  'Mã câu hỏi chỉ gồm chữ thường không dấu (a-z), số, "-" hoặc "_".'

export const normalizeText = (value: string): string => value.normalize('NFC').trim()

export const normalizeQuestionKey = (value: string): string => normalizeText(value).toLowerCase()

export const validateQuestionKey = (key: string): true | string =>
  QUESTION_KEY_PATTERN.test(key) ? true : INVALID_QUESTION_KEY_MESSAGE

/** Trả về các mã xuất hiện từ hai lần trở lên trong cùng một worksheet. */
export const findDuplicateQuestionKeys = (questions: unknown): string[] => {
  if (!Array.isArray(questions)) return []

  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const question of questions) {
    const key = (question as { key?: unknown } | null)?.key

    if (typeof key !== 'string' || key === '') continue

    if (seen.has(key)) {
      duplicates.add(key)
    } else {
      seen.add(key)
    }
  }

  return [...duplicates]
}
