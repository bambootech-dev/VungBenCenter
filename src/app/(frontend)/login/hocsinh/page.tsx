import { RoleLogin } from '@/components/RoleLogin'
import { SessionSync } from '@/components/SessionSync'
import { redirectSignedInUser } from '@/utilities/viewer'

export default async function HocSinhLoginPage() {
  await redirectSignedInUser()

  return (
    <>
      <SessionSync />
      <RoleLogin
        role="hocsinh"
        title="Đăng nhập Học sinh / Phụ huynh"
        redirectTo="/hocsinh/dashboard"
      />
    </>
  )
}
