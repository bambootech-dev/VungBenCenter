import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

export default async function HocSinhDashboardPage() {
  const payload = await getPayload({ config })
  const headers = await getHeaders()

  const { user } = await payload.auth({
    headers,
    canSetHeaders: false,
  })

  if (!user) {
    redirect('/login/hocsinh')
  }

  if (user.role !== 'hocsinh') {
    if (user.role === 'admin') {
      redirect('/admin')
    }

    redirect('/giaovien/dashboard')
  }

  return (
    <main style={{ padding: '32px' }}>
      <h1>Trang Học sinh</h1>

      <p>
        Xin chào {user.name || user.email}
      </p>
    </main>
  )
}