import { RoleLogin } from '@/components/RoleLogin'

export default function GiaoVienLoginPage() {
  return (
    <RoleLogin
      role="giaovien"
      title="Đăng nhập Giáo viên"
      redirectTo="/giaovien/dashboard"
    />
  )
}