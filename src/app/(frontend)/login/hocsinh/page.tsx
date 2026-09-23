import { RoleLogin } from '@/components/RoleLogin'

export default function HocSinhLoginPage() {
  return (
    <RoleLogin
      role="hocsinh"
      title="Đăng nhập Học sinh"
      redirectTo="/hocsinh/dashboard"
    />
  )
}