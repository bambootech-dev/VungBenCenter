import { RoleRegister } from '@/components/RoleRegister'
import { SessionSync } from '@/components/SessionSync'
import { redirectSignedInUser } from '@/utilities/viewer'

export default async function GiaoVienRegisterPage() {
  await redirectSignedInUser()

  return (
    <>
      <SessionSync />
      <RoleRegister
        role="giaovien"
        title="Đăng ký Giáo viên"
        loginTo="/login/giaovien"
      />
    </>
  )
}
