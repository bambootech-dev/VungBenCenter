import { RoleLogin } from '@/components/RoleLogin'
import { SessionSync } from '@/components/SessionSync'
import { redirectSignedInUser } from '@/utilities/viewer'

export default async function GiaoVienLoginPage() {
  await redirectSignedInUser()

  return (
    <>
      <SessionSync />
      <RoleLogin
        role="giaovien"
        title="Đăng nhập Giáo viên"
        redirectTo="/giaovien/dashboard"
      />
    </>
  )
}
