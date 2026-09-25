import type { User } from '@/payload-types'

// Dấu hiệu đăng ký công khai, chỉ được đặt phía server trong registerAccount.ts
// qua Local API `context`. Không bao giờ đọc giá trị này từ form hoặc client.
export const PUBLIC_SIGNUP_SOURCE = 'public-signup'

export const SYSTEM_NOT_INITIALIZED_MESSAGE =
  'Hệ thống chưa được khởi tạo. Vui lòng liên hệ Quản trị viên.'

export const INVALID_SIGNUP_ROLE_MESSAGE = 'Vai trò đăng ký không hợp lệ.'

export type PublicSignupRole = 'giaovien' | 'hocsinh'

// Trạng thái tài khoản cố định theo vai trò khi đăng ký công khai
export const PUBLIC_SIGNUP_ACCOUNT_STATUS: Record<
  PublicSignupRole,
  NonNullable<User['accountStatus']>
> = {
  giaovien: 'pending',
  hocsinh: 'active',
}

export const isPublicSignupRole = (role: unknown): role is PublicSignupRole => {
  return role === 'giaovien' || role === 'hocsinh'
}
