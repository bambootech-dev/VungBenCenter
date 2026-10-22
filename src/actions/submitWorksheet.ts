'use server'

import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { APIError, getPayload, ValidationError } from 'payload'

import { ANSWER_MAX_LENGTH } from '@/collections/WorksheetSubmissions/answers'

export type SubmitWorksheetResult =
  | { ok: true; id: number }
  | {
      ok: false
      // unauthenticated: phiên hết hạn; forbidden: không còn quyền (ví dụ bị chuyển pending);
      // invalid: dữ liệu bị server từ chối; error: lỗi khác
      reason: 'error' | 'forbidden' | 'invalid' | 'unauthenticated'
      message: string
      // Lỗi theo mã câu hỏi (questionKey), để form gắn đúng ô nhập
      fieldErrors?: Record<string, string>
    }

const CHANGED_MESSAGE =
  'Phiếu vừa được cập nhật hoặc không còn tồn tại. Hãy sao chép câu trả lời, tải lại trang rồi nộp lại.'

const GENERIC_ERROR = 'Chưa nộp được phiếu. Vui lòng thử lại sau ít phút.'

// Tham số Server Action do client gửi lên nên không tin vào kiểu dữ liệu
const pickAnswers = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map((item: unknown) => {
        const answer = (item ?? {}) as { questionKey?: unknown; value?: unknown }

        return { questionKey: answer.questionKey, value: answer.value }
      })
    : value

/**
 * Giáo viên nộp phiếu. Server Action gọi được bằng POST trực tiếp, nên luôn tự xác thực:
 * user lấy từ cookie phiên, Local API chạy với `overrideAccess: false` để áp dụng access
 * control của collection. Giáo viên, thời gian nộp và bản chụp đề do hook của collection đặt.
 */
export async function submitWorksheet(input: {
  answers: unknown
  worksheetId: unknown
}): Promise<SubmitWorksheetResult> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await getHeaders(), canSetHeaders: false })

  if (!user) {
    return {
      ok: false,
      reason: 'unauthenticated',
      message: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại rồi bấm “Nộp phiếu” lần nữa.',
    }
  }

  if (user.role !== 'giaovien' || user.accountStatus !== 'active') {
    return {
      ok: false,
      reason: 'forbidden',
      message: 'Tài khoản của bạn hiện không được nộp phiếu. Vui lòng liên hệ Quản trị viên.',
    }
  }

  const worksheetId = input?.worksheetId
  const answers = pickAnswers(input?.answers)

  if (typeof worksheetId !== 'number' || !Number.isInteger(worksheetId)) {
    return { ok: false, reason: 'invalid', message: CHANGED_MESSAGE }
  }

  try {
    const doc = await payload.create({
      collection: 'worksheet-submissions',
      // Chỉ hai field client được gửi; hook bỏ mọi field khác
      data: { answers, worksheet: worksheetId } as never,
      depth: 0,
      overrideAccess: false,
      user,
    })

    return { ok: true, id: doc.id }
  } catch (error) {
    if (error instanceof ValidationError) {
      const fieldErrors: Record<string, string> = {}
      let changed = false
      let missingRequired = false

      for (const { path } of error.data.errors) {
        const match = /^answers\.(\d+)\.value$/.exec(path)
        const key = match && Array.isArray(answers) ? (answers[Number(match[1])] as { questionKey?: unknown }).questionKey : null

        if (typeof key === 'string') {
          fieldErrors[key] = `Câu trả lời không hợp lệ hoặc dài quá ${ANSWER_MAX_LENGTH} ký tự.`
        } else if (path === 'answers') {
          missingRequired = true
        } else {
          // worksheet không còn / mã câu hỏi không còn thuộc phiếu
          changed = true
        }
      }

      return {
        ok: false,
        reason: 'invalid',
        fieldErrors,
        message: changed
          ? CHANGED_MESSAGE
          : missingRequired
            ? 'Còn câu bắt buộc chưa trả lời. Nếu bạn đã trả lời đủ, phiếu có thể vừa được cập nhật — hãy tải lại trang.'
            : 'Vui lòng kiểm tra lại các câu được đánh dấu.',
      }
    }

    if (error instanceof APIError && error.status === 403) {
      return {
        ok: false,
        reason: 'forbidden',
        message: 'Tài khoản của bạn hiện không được nộp phiếu. Vui lòng liên hệ Quản trị viên.',
      }
    }

    payload.logger.error({ err: error, userId: user.id, worksheetId }, 'submitWorksheet failed')

    return { ok: false, reason: 'error', message: GENERIC_ERROR }
  }
}
