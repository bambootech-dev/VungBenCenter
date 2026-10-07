// Tên cố định của 9 bước trong group `steps`. Dùng chung cho schema và trang /bai-hoc/[id].
export const LESSON_STEP_KEYS = [
  'step1',
  'step2',
  'step3',
  'step4',
  'step5',
  'step6',
  'step7',
  'step8',
  'step9',
] as const

export type LessonStepKey = (typeof LESSON_STEP_KEYS)[number]

export const LESSON_STEP_COUNT = LESSON_STEP_KEYS.length

/**
 * Đọc `?step=` và luôn trả về số bước trong khoảng 1–9.
 * Giá trị thiếu hoặc không phải số → 1; nhỏ hơn 1 → 1; lớn hơn 9 → 9.
 */
export const parseLessonStep = (value: string | string[] | undefined): number => {
  const raw = Array.isArray(value) ? value[0] : value
  const step = Number.parseInt(raw ?? '', 10)

  if (Number.isNaN(step)) return 1

  return Math.min(Math.max(step, 1), LESSON_STEP_COUNT)
}
