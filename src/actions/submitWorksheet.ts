'use server'

import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { APIError, getPayload, ValidationError } from 'payload'

export type SubmitWorksheetResult =
  | { ok: true; id: number }
  | {
      ok: false
      // unauthenticated: phiên hết hạn; forbidden: không còn quyền (ví dụ bị chuyển pending);
      // invalid: dữ liệu bị server từ chối; error: lỗi khác
      reason: 'error' | 'forbidden' | 'invalid' | 'unauthenticated'
      message: string
      // Lỗi theo đường dẫn ô nhập: `values.<key>` hoặc `values.<bảng>.<dòng>.<cột>`
      fieldErrors?: Record<string, string>
    }

const GENERIC_ERROR = 'Chưa nộp được phiếu. Vui lòng thử lại sau ít phút.'
const FORBIDDEN_MESSAGE = 'Tài khoản của bạn hiện không được nộp phiếu. Vui lòng liên hệ Quản trị viên.'

/**
 * Giáo viên nộp phiếu theo mẫu hệ thống. Server Action gọi được bằng POST trực tiếp, nên luôn tự
 * xác thực: user lấy từ cookie phiên, Local API chạy với `overrideAccess: false` để áp dụng access
 * control của collection. Giáo viên, thời gian nộp và bản chụp mẫu do hook của collection đặt.
 */
export async function submitWorksheet(input: {
  templateCode: unknown
  values: unknown
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
    return { ok: false, reason: 'forbidden', message: FORBIDDEN_MESSAGE }
  }

  try {
    const doc = await payload.create({
      collection: 'worksheet-submissions',
      // Chỉ hai field client được gửi; hook bỏ mọi field khác
      data: { data: input?.values, templateCode: input?.templateCode } as never,
      depth: 0,
      overrideAccess: false,
      user,
    })

    return { ok: true, id: doc.id }
  } catch (error) {
    if (error instanceof ValidationError) {
      const fieldErrors: Record<string, string> = {}

      for (const { message, path } of error.data.errors) {
        fieldErrors[path] = message
      }

      return {
        ok: false,
        reason: 'invalid',
        fieldErrors,
        message: fieldErrors.templateCode
          ? 'Mẫu phiếu không còn tồn tại. Hãy sao chép nội dung, tải lại trang rồi thử lại.'
          : 'Vui lòng kiểm tra lại các ô được đánh dấu.',
      }
    }

    if (error instanceof APIError && error.status === 403) {
      return { ok: false, reason: 'forbidden', message: FORBIDDEN_MESSAGE }
    }

    payload.logger.error({ err: error, userId: user.id }, 'submitWorksheet failed')

    return { ok: false, reason: 'error', message: GENERIC_ERROR }
  }
}
