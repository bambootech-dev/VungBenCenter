import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { cardClass, pageTitleClass, pillClass } from '@/components/ui/brand'

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
    <main className="flex-1">
      <div className="lesson-container py-10 md:py-14">
        <p className={`${pillClass} mb-3`}>Vững Bền Center</p>
        <h1 className={`${pageTitleClass} mb-6`}>Trang Học sinh / Phụ huynh</h1>

        <p className={`${cardClass} p-6 text-lg font-bold text-lesson-primary-dark`}>
          Xin chào {user.name || user.email}
        </p>
      </div>
    </main>
  )
}