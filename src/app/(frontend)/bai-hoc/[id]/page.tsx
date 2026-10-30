import type { Metadata } from 'next'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RichText } from '@payloadcms/richtext-lexical/react'
import clsx from 'clsx'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import React from 'react'

import { formatSoundLabel } from '@/collections/Lessons/sound'
import { LESSON_STEP_COUNT, LESSON_STEP_KEYS, parseLessonStep } from '@/collections/Lessons/steps'
import { BackLink } from '@/components/BackLink'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { hasLesson } from '@/utilities/lessonAccess'
import { getDashboardHref } from '@/utilities/viewer'
import { getViewerLessonAccess } from '@/utilities/viewerLessonAccess'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const metadata: Metadata = {
  title: 'Bài học',
}

const stepHref = (lessonId: number, step: number) => `/bai-hoc/${lessonId}?step=${step}`

export default async function LessonPage({ params, searchParams }: Props) {
  const { payload, user } = await getCurrentUser()

  // Tài khoản chưa kích hoạt: về trang chính của vai trò (có thông báo), như trước
  if (user && user.accountStatus !== 'active') {
    redirect(getDashboardHref(user))
  }

  const { id } = await params
  const step = parseLessonStep((await searchParams).step)

  // ID của Postgres là số nguyên; giá trị khác không bao giờ khớp bài học nào
  if (!/^\d+$/.test(id)) {
    notFound()
  }

  const lessonId = Number(id)
  // Kiểm tra quyền trên server trước khi đọc nội dung; field access của `steps` là lớp bảo vệ thứ hai
  const unlocked = hasLesson(await getViewerLessonAccess(), lessonId)

  const query = {
    collection: 'lessons',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user: user ?? undefined,
    where: { id: { equals: lessonId } },
  } as const

  if (!unlocked) {
    // Chưa có quyền: chỉ đọc tên bài, không đọc nội dung các bước
    const {
      docs: [locked],
    } = await payload.find({ ...query, select: { sound: true } })

    if (!locked) notFound()

    return <LockedLesson isGuest={!user} label={formatSoundLabel(locked.sound)} lessonId={locked.id} />
  }

  const {
    docs: [lesson],
  } = await payload.find(query)

  if (!lesson) {
    notFound()
  }

  const content = lesson.steps?.[LESSON_STEP_KEYS[step - 1]]
  const hasContent = Boolean(content?.root?.children?.length)

  return (
    <div className="container py-4 py-md-5">
      <div className="col-xl-10 mx-auto">
        <BackLink href="/bai-hoc">Danh sách bài học</BackLink>

        <div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4">
          <div>
            <p className="badge bg-primary-subtle text-primary-emphasis fs-6 mb-2">Luyện phát âm</p>
            <h1 className="display-5 mb-0">{formatSoundLabel(lesson.sound)}</h1>
          </div>

          <nav aria-label="Các bước" className="card p-2">
            {/* Mobile: lưới 5 cột (5 + 4), mỗi nút vẫn ≥ 44px; từ sm trở lên: một hàng */}
            <ol className="nav nav-pills step-nav d-grid d-sm-flex gap-2 list-unstyled mb-0">
              {LESSON_STEP_KEYS.map((key, index) => {
                const number = index + 1
                const isCurrent = number === step

                return (
                  <li className="nav-item" key={key}>
                    <Link
                      aria-current={isCurrent ? 'step' : undefined}
                      aria-label={`Bước ${number}`}
                      className={clsx('nav-link', isCurrent && 'active')}
                      href={stepHref(lesson.id, number)}
                    >
                      {number}
                    </Link>
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>

        <section aria-labelledby="step-heading" className="card shadow-sm">
          <div className="card-body p-4 p-sm-5">
            <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
              <h2 className="badge text-bg-accent fs-6 mb-0" id="step-heading">
                Bước {step} / {LESSON_STEP_COUNT}
              </h2>
              <div
                aria-hidden="true"
                className="progress flex-grow-1"
              >
                <div className={`progress-bar w-step-${step}`} />
              </div>
            </div>

            <div className="lesson-min-h" data-testid="step-content">
              {hasContent ? (
                <RichText className="lesson-prose" data={content as SerializedEditorState} />
              ) : (
                <p className="fs-5 text-body-secondary">Bước này chưa có nội dung.</p>
              )}
            </div>
          </div>

          <div className="card-footer bg-transparent d-flex justify-content-between gap-3 p-4">
            <StepButton href={step > 1 ? stepHref(lesson.id, step - 1) : null} variant="outline">
              <i aria-hidden="true" className="bi bi-arrow-left" />
              Trước
            </StepButton>
            <StepButton href={step < LESSON_STEP_COUNT ? stepHref(lesson.id, step + 1) : null} variant="primary">
              Tiếp
              <i aria-hidden="true" className="bi bi-arrow-right" />
            </StepButton>
          </div>
        </section>
      </div>
    </div>
  )
}

const StepButton = ({
  children,
  href,
  variant,
}: {
  children: React.ReactNode
  href: string | null
  variant: 'outline' | 'primary'
}) => {
  const className = clsx(
    'btn btn-lg d-inline-flex align-items-center justify-content-center gap-2 px-4',
    variant === 'primary' ? 'btn-primary' : 'btn-outline-primary',
    !href && 'disabled',
  )

  // Bước đầu/cuối: nút vẫn hiển thị ở cùng vị trí nhưng bị vô hiệu hóa (không lưu tiến độ)
  if (!href) {
    return (
      <span aria-disabled="true" className={className} role="link">
        {children}
      </span>
    )
  }

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  )
}

const LockedLesson = ({ isGuest, label, lessonId }: { isGuest: boolean; label: string; lessonId: number }) => (
  <div className="container py-4 py-md-5">
    <div className="col-lg-8 col-xl-6 mx-auto">
      <BackLink href="/bai-hoc">Danh sách bài học</BackLink>

      <div className="card shadow-sm text-center" data-testid="lesson-locked">
        <div className="card-body p-4 p-sm-5">
          <span aria-hidden="true" className="icon-circle bg-accent-subtle text-accent-emphasis mb-3">
            <i className="bi bi-lock-fill" />
          </span>
          <p className="badge bg-primary-subtle text-primary-emphasis fs-6 mb-2">Luyện phát âm</p>
          <h1 className="mb-3">{label}</h1>
          <p className="lead fw-bold mb-2">Bạn chưa có quyền truy cập bài học này.</p>
          <p className="text-body-secondary mb-4">
            {isGuest
              ? 'Đăng nhập và mua gói học có bài này để mở khóa nội dung 9 bước.'
              : 'Mua gói học có bài này để mở khóa nội dung 9 bước. Quyền được mở sau khi trung tâm xác nhận thanh toán.'}
          </p>
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
            <Link className="btn btn-primary btn-lg" href={`/goi-hoc?bai=${lessonId}`}>
              <i aria-hidden="true" className="bi bi-bag-heart me-2" />
              Xem gói học
            </Link>
            {isGuest && (
              <Link className="btn btn-outline-primary btn-lg" href="/login">
                Đăng nhập
              </Link>
            )}
            <Link className="btn btn-outline-secondary btn-lg" href="/bai-hoc">
              Quay lại danh sách bài học
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
)
