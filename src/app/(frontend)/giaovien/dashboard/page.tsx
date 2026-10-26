import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { PageHeader } from '@/components/PageHeader'

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
    <div className="container py-5">
      <PageHeader eyebrow="Giáo viên" title="Trang Giáo viên" />

      <p className="card card-body fs-5 fw-bold text-primary-emphasis mb-4">
        <span>
          <i aria-hidden="true" className="bi bi-emoji-smile me-2 text-accent" />
          Xin chào {user.name || user.email}
        </span>
      </p>

      <div className="row row-cols-1 row-cols-md-2 g-4">
        <div className="col">
          <Link className="card card-hover h-100" href="/giaovien/phieu">
            <div className="card-body d-flex align-items-start gap-3 p-4">
              <span aria-hidden="true" className="icon-circle bg-primary-subtle text-primary">
                <i className="bi bi-clipboard2-plus-fill" />
              </span>
              <span>
                <span className="d-block h5 mb-1">Phiếu</span>
                <span className="text-body-secondary">Chọn mẫu và điền phiếu mới.</span>
              </span>
            </div>
          </Link>
        </div>
        <div className="col">
          <Link className="card card-hover h-100" href="/giaovien/bai-da-nop">
            <div className="card-body d-flex align-items-start gap-3 p-4">
              <span aria-hidden="true" className="icon-circle bg-primary-subtle text-primary">
                <i className="bi bi-file-earmark-check-fill" />
              </span>
              <span>
                <span className="d-block h5 mb-1">Bài đã nộp</span>
                <span className="text-body-secondary">Xem lại các phiếu bạn đã nộp.</span>
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
