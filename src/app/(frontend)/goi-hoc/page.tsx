import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { formatSoundLabel } from '@/collections/Lessons/sound'
import { formatDuration, formatPrice, PLAN_KIND_LABELS } from '@/collections/Plans/plan'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { SessionSync } from '@/components/SessionSync'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { hasLesson } from '@/utilities/lessonAccess'
import { getViewerLessonAccess } from '@/utilities/viewerLessonAccess'

import { BuyButton } from './BuyButton'

export const metadata: Metadata = {
  title: 'Gói học',
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PlansPage({ searchParams }: Props) {
  const { payload, user } = await getCurrentUser()
  const access = await getViewerLessonAccess()
  const lessonParam = (await searchParams).bai
  const lessonId = typeof lessonParam === 'string' && /^\d+$/.test(lessonParam) ? Number(lessonParam) : null

  // Access của Plans chỉ trả gói đang bán cho người không phải Admin
  const { docs: plans } = await payload.find({
    collection: 'plans',
    depth: 1,
    overrideAccess: false,
    pagination: false,
    // Chỉ cần tên âm của bài trong gói
    populate: { lessons: { sound: true } },
    sort: 'sortOrder',
    user: user ?? undefined,
    where: { isActive: { equals: true } },
  })

  const lessonIdsOf = (plan: (typeof plans)[number]) =>
    (plan.lessons ?? []).map((lesson) => (typeof lesson === 'object' ? lesson.id : lesson))

  // Từ một bài chưa mở khóa: chỉ hiện các gói có bài đó
  const visiblePlans = lessonId ? plans.filter((plan) => lessonIdsOf(plan).includes(lessonId)) : plans
  const canBuy = user?.role === 'hocsinh' && user.accountStatus === 'active'

  return (
    <div className="container py-5">
      <SessionSync />
      <PageHeader
        eyebrow="Vững Bền Center"
        lead="Mua riêng từng bài hoặc chọn gói nhiều bài theo tháng. Quyền học được mở sau khi trung tâm xác nhận thanh toán."
        title="Gói học"
      />

      {lessonId && (
        <div className="alert alert-info d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span>Đang hiển thị các gói có bài bạn vừa chọn.</span>
          <Link className="alert-link" href="/goi-hoc">
            Xem tất cả gói
          </Link>
        </div>
      )}

      {access.all && (
        <div className="alert alert-success" role="status">
          Tài khoản của bạn đã xem được tất cả bài học, không cần mua gói.
        </div>
      )}

      {visiblePlans.length === 0 ? (
        <EmptyState
          action={{ href: '/bai-hoc', label: 'Quay lại danh sách bài học' }}
          icon="bi-bag"
          message="Hiện chưa có gói học nào đang mở bán."
        />
      ) : (
        <ul className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4 list-unstyled mb-0" data-testid="plan-grid">
          {visiblePlans.map((plan) => {
            const lessons = (plan.lessons ?? []).filter((lesson) => typeof lesson === 'object')
            const ownsAll = lessons.length > 0 && lessons.every((lesson) => hasLesson(access, lesson.id))

            return (
              <li className="col" key={plan.id}>
                <article aria-labelledby={`plan-${plan.id}`} className="card h-100 shadow-sm" data-testid="plan-card">
                  <div className="card-body p-4 d-flex flex-column">
                    <p className="badge bg-accent-subtle text-accent-emphasis align-self-start mb-2">
                      {PLAN_KIND_LABELS[plan.kind]}
                    </p>
                    <h2 className="h3 mb-1" id={`plan-${plan.id}`}>
                      {plan.name}
                    </h2>
                    <p className="display-6 fw-bold text-primary mb-1">{formatPrice(plan.price)}</p>
                    <p className="text-body-secondary mb-3">
                      <i aria-hidden="true" className="bi bi-calendar-check me-2" />
                      Thời hạn: {formatDuration(plan)}
                    </p>
                    {plan.description && <p className="mb-3">{plan.description}</p>}

                    <h3 className="h6 text-uppercase text-body-secondary fw-bold">Bài học trong gói</h3>
                    <ul className="list-unstyled d-flex flex-wrap gap-2 mb-3">
                      {lessons.map((lesson) => (
                        <li className="badge bg-primary-subtle text-primary-emphasis fs-6" key={lesson.id}>
                          {formatSoundLabel(lesson.sound)}
                        </li>
                      ))}
                    </ul>

                    {plan.benefits && plan.benefits.length > 0 && (
                      <>
                        <h3 className="h6 text-uppercase text-body-secondary fw-bold">Quyền lợi</h3>
                        <ul className="list-unstyled d-grid gap-1 mb-4">
                          {plan.benefits.map((benefit) => (
                            <li key={benefit.id}>
                              <i aria-hidden="true" className="bi bi-check-circle-fill text-primary me-2" />
                              {benefit.text}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    <div className="mt-auto">
                      {ownsAll ? (
                        <p className="alert alert-success mb-0">
                          <i aria-hidden="true" className="bi bi-unlock-fill me-2" />
                          Bạn đã mở khóa tất cả bài trong gói này.
                        </p>
                      ) : canBuy ? (
                        <BuyButton planId={plan.id} planName={plan.name} />
                      ) : !user ? (
                        <Link className="btn btn-primary btn-lg w-100" href="/login/hocsinh">
                          Đăng nhập để mua
                        </Link>
                      ) : (
                        <p className="small text-body-secondary mb-0">
                          Chỉ tài khoản Học sinh / Phụ huynh đã kích hoạt mới đặt mua được gói học.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
