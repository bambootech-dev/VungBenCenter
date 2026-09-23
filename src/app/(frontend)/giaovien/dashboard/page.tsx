import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

export default async function GiaoVienDashboardPage() {
  const payload = await getPayload({ config })
  const headers = await getHeaders()

  const { user } = await payload.auth({
    headers,
    canSetHeaders: false,
  })

  if (!user) {
    redirect('/login/giaovien')
  }

  if (user.role !== 'giaovien') {
    if (user.role === 'admin') {
      redirect('/admin')
    }

    redirect('/hocsinh/dashboard')
  }

  return (
    <main style={{ padding: '32px' }}>
      <h1>Trang Giáo viên</h1>

      <p>
        Xin chào {user.name || user.email}
      </p>
    </main>
  )
}