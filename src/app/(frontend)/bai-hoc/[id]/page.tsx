import type { Metadata } from 'next'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RichText } from '@payloadcms/richtext-lexical/react'
import clsx from 'clsx'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { formatSoundLabel } from '@/collections/Lessons/sound'
import { LESSON_STEP_COUNT, LESSON_STEP_KEYS, parseLessonStep } from '@/collections/Lessons/steps'
import { BackLink } from '@/components/BackLink'
import { requireActiveUser } from '@/utilities/requireActiveUser'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const metadata: Metadata = {
  title: 'Bài học',
}

const stepHref = (lessonId: number, step: number) => `/bai-hoc/${lessonId}?step=${step}`

export default async function LessonPage({ params, searchParams }: Props) {
  const { payload, user } = await requireActiveUser()

  const { id } = await params
  const step = parseLessonStep((await searchParams).step)

  // ID của Postgres là số nguyên; giá trị khác không bao giờ khớp bài học nào
  if (!/^\d+$/.test(id)) {
    notFound()
  }

  const {
    docs: [lesson],
  } = await payload.find({
    collection: 'lessons',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      id: {
        equals: Number(id),
      },
    },
  })

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
