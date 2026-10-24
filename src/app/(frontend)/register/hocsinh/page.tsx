import { RoleRegister } from '@/components/RoleRegister'

export default function HocSinhRegisterPage() {
  return (
    <RoleRegister
      role="hocsinh"
      title="Đăng ký tài khoản người học"
      loginTo="/login/hocsinh"
    />
  )
}