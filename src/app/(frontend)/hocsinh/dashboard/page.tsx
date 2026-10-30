import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AccountStatusNotice } from '@/components/AccountStatusNotice'
import { PageHeader } from '@/components/PageHeader'
import { SessionSync } from '@/components/SessionSync'
import { getCurrentUser } from '@/utilities/getCurrentUser'

import { MyPlans } from './MyPlans'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function HocSinhDashboardPage({ searchParams }: Props) {
  const { payload, user } = await getCurrentUser()
  const orderParam = (await searchParams)['don-hang']
  const newOrderId = typeof orderParam === 'string' && /^\d+$/.test(orderParam) ? Number(orderParam) : null

  if (!user) {
    redirect('/login/hocsinh')
  }

  if (user.role !== 'hocsinh') {
    if (user.role === 'admin') {
      redirect('/admin')
    }

    redirect('/giaovien/dashboard')
  }

  if (user.accountStatus !== 'active') {
    return (
      <AccountStatusNotice
        eyebrow="Học sinh / Phụ huynh"
        message="Tài khoản chưa được kích hoạt. Vui lòng liên hệ trung tâm."
        title="Trang Học sinh / Phụ huynh"
      />
    )
  }

  return (
    <div className="container py-5">
      <SessionSync />
      <PageHeader eyebrow="Học sinh / Phụ huynh" title="Trang Học sinh / Phụ huynh" />

      <p className="card card-body fs-5 fw-bold text-primary-emphasis mb-4">
        <span>
          <i aria-hidden="true" className="bi bi-emoji-smile me-2 text-accent" />
          Xin chào {user.name || user.email}
        </span>
      </p>

      <div className="row row-cols-1 row-cols-md-2 g-4">
        <div className="col">
          <Link className="card card-hover h-100" href="/bai-hoc">
            <div className="card-body d-flex align-items-start gap-3 p-4">
              <span aria-hidden="true" className="icon-circle bg-primary-subtle text-primary">
                <i className="bi bi-mic-fill" />
              </span>
              <span>
                <span className="d-block h5 mb-1">Bài học</span>
                <span className="text-body-secondary">Chọn một âm và luyện phát âm theo từng bước.</span>
              </span>
            </div>
          </Link>
        </div>
        <div className="col">
          <Link className="card card-hover h-100" href="/goi-hoc">
            <div className="card-body d-flex align-items-start gap-3 p-4">
              <span aria-hidden="true" className="icon-circle bg-accent-subtle text-accent-emphasis">
                <i className="bi bi-bag-heart-fill" />
              </span>
              <span>
                <span className="d-block h5 mb-1">Gói học</span>
                <span className="text-body-secondary">Mua riêng từng bài hoặc gói nhiều bài theo tháng.</span>
              </span>
            </div>
          </Link>
        </div>
      </div>

      <MyPlans newOrderId={newOrderId} payload={payload} user={user} />
    </div>
  )
}
