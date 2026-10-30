import { RoleRegister } from '@/components/RoleRegister'
import { SessionSync } from '@/components/SessionSync'
import { redirectSignedInUser } from '@/utilities/viewer'

export default async function HocSinhRegisterPage() {
  await redirectSignedInUser()

  return (
    <>
      <SessionSync />
      <RoleRegister
        role="hocsinh"
        title="Đăng ký tài khoản người học"
        loginTo="/login/hocsinh"
      />
    </>
  )
}
