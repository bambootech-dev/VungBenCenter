'use server'

import config from '@payload-config'
import { APIError, getPayload } from 'payload'

import {
  INVALID_SIGNUP_ROLE_MESSAGE,
  PUBLIC_SIGNUP_ACCOUNT_STATUS,
  PUBLIC_SIGNUP_SOURCE,
  SYSTEM_NOT_INITIALIZED_MESSAGE,
  isPublicSignupRole,
  type PublicSignupRole,
} from '@/collections/Users/registration'

type RegisterInput = {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: PublicSignupRole
}

type RegisterResult =
  | { success: true; message: string }
  | { success: false; error: string }

const GENERIC_ERROR = 'Không thể tạo tài khoản. Email này có thể đã được sử dụng.'

// Tham số Server Action do client gửi lên nên không tin vào kiểu dữ liệu
const asString = (value: unknown): string => (typeof value === 'string' ? value : '')

export async function registerAccount(input: RegisterInput): Promise<RegisterResult> {
  const name = asString(input?.name).trim()
  const email = asString(input?.email).trim().toLowerCase()
  const password = asString(input?.password)
  const confirmPassword = asString(input?.confirmPassword)
  const role: unknown = input?.role

  // Không bao giờ nhận role admin từ trang đăng ký công khai
  if (!isPublicSignupRole(role)) {
    return {
      success: false,
      error: INVALID_SIGNUP_ROLE_MESSAGE,
    }
  }

  if (!name || !email || !password) {
    return {
      success: false,
      error: 'Vui lòng nhập đầy đủ thông tin.',
    }
  }

  if (password.length < 8) {
    return {
      success: false,
      error: 'Mật khẩu phải có ít nhất 8 ký tự.',
    }
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: 'Mật khẩu xác nhận không khớp.',
    }
  }

  const payload = await getPayload({ config })

  try {
    const user = await payload.create({
      collection: 'users',
      overrideAccess: true,
      // Dấu hiệu đăng ký công khai do server đặt, hook Users dựa vào đây
      // để chặn mọi khả năng nâng quyền
      context: {
        registrationSource: PUBLIC_SIGNUP_SOURCE,
      },
      data: {
        name,
        email,
        password,
        role,
        accountStatus: PUBLIC_SIGNUP_ACCOUNT_STATUS[role],
      },
    })

    // Lưới an toàn cuối: tài khoản tạo ra phải đúng vai trò đã đăng ký
    if (user.role !== role) {
      await payload.delete({
        collection: 'users',
        id: user.id,
        overrideAccess: true,
      })

      payload.logger.error(
        { userId: user.id, expectedRole: role, actualRole: user.role },
        'Public signup produced an unexpected role; account removed',
      )

      return {
        success: false,
        error: GENERIC_ERROR,
      }
    }

    if (role === 'giaovien') {
      return {
        success: true,
        message: 'Đăng ký thành công. Tài khoản Giáo viên đang chờ Admin phê duyệt.',
      }
    }

    return {
      success: true,
      message: 'Đăng ký thành công. Bạn có thể đăng nhập.',
    }
  } catch (error) {
    if (error instanceof APIError && error.message === SYSTEM_NOT_INITIALIZED_MESSAGE) {
      return {
        success: false,
        error: SYSTEM_NOT_INITIALIZED_MESSAGE,
      }
    }

    // Chỉ ghi log phía server, không trả chi tiết lỗi database cho client
    payload.logger.error({ err: error }, 'Public signup failed')

    return {
      success: false,
      error: GENERIC_ERROR,
    }
  }
}
