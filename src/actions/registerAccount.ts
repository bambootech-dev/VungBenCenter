'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

type RegisterRole = 'giaovien' | 'hocsinh'

type RegisterInput = {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: RegisterRole
}

export async function registerAccount(input: RegisterInput) {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const password = input.password

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

  if (password !== input.confirmPassword) {
    return {
      success: false,
      error: 'Mật khẩu xác nhận không khớp.',
    }
  }

  // Không bao giờ nhận role admin từ trang đăng ký công khai
  if (input.role !== 'giaovien' && input.role !== 'hocsinh') {
    return {
      success: false,
      error: 'Vai trò đăng ký không hợp lệ.',
    }
  }

  const payload = await getPayload({ config })

  try {
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name,
        email,
        password,
        role: input.role,
        accountStatus:
          input.role === 'giaovien' ? 'pending' : 'active',
      },
    })

    if (input.role === 'giaovien') {
      return {
        success: true,
        message:
          'Đăng ký thành công. Tài khoản Giáo viên đang chờ Admin phê duyệt.',
      }
    }

    return {
      success: true,
      message: 'Đăng ký thành công. Bạn có thể đăng nhập.',
    }
  } catch {
    return {
      success: false,
      error:
        'Không thể tạo tài khoản. Email này có thể đã được sử dụng.',
    }
  }
}