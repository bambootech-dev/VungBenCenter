import { RoleRegister } from '@/components/RoleRegister'

export default function GiaoVienRegisterPage() {
  return (
    <RoleRegister
      role="giaovien"
      title="Đăng ký Giáo viên"
      loginTo="/login/giaovien"
    />
  )
}