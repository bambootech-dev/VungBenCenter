import { RoleRegister } from '@/components/RoleRegister'

export default function HocSinhRegisterPage() {
  return (
    <RoleRegister
      role="hocsinh"
      title="Đăng ký Học sinh"
      loginTo="/login/hocsinh"
    />
  )
}