import type { Metadata } from 'next'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { ArrowLeft, ArrowRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { formatSoundLabel } from '@/collections/Lessons/sound'
import { LESSON_STEP_COUNT, LESSON_STEP_KEYS, parseLessonStep } from '@/collections/Lessons/steps'
import { cn } from '@/utilities/ui'
import { requireActiveUser } from '@/utilities/requireActiveUser'

import { lessonFont } from '../_components/lessonFont'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const metadata: Metadata = {
  title: 'Bài học',
}

const stepHref = (lessonId: number, step: number) => `/bai-hoc/${lessonId}?step=${step}`

const focusRing =
  'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lesson-primary-dark'

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
    <main className={cn(lessonFont.className, 'lesson-page flex-1')}>
      <div className="lesson-container py-6 md:py-10">
        <div className="mx-auto max-w-5xl">
          <Link
            className={cn(
              'mb-5 inline-flex min-h-11 items-center gap-1 rounded-full pr-3 text-base font-bold text-lesson-primary-dark hover:underline',
              focusRing,
            )}
            href="/bai-hoc"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
            Danh sách bài học
          </Link>

          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-lesson-primary-soft px-4 py-1.5 text-sm font-bold text-lesson-primary-dark">
                Luyện phát âm
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-lesson-primary-dark md:text-5xl">
                {formatSoundLabel(lesson.sound)}
              </h1>
            </div>

            <nav
              aria-label="Các bước"
              className="rounded-[1.75rem] border-2 border-lesson-border bg-lesson-surface/80 p-2"
            >
              {/* Mobile: lưới 5 cột (5 + 4), mỗi nút vẫn ≥ 44px; từ sm trở lên: một hàng */}
              <ol className="grid grid-cols-5 justify-items-center gap-1.5 sm:flex sm:gap-2">
                {LESSON_STEP_KEYS.map((key, index) => {
                  const number = index + 1
                  const isCurrent = number === step

                  return (
                    <li key={key}>
                      <Link
                        aria-current={isCurrent ? 'step' : undefined}
                        aria-label={`Bước ${number}`}
                        className={cn(
                          'flex size-11 items-center justify-center rounded-full text-lg font-extrabold transition',
                          focusRing,
                          // Bước hiện tại: nền đậm + viền, không chỉ dựa vào màu
                          isCurrent
                            ? 'bg-lesson-primary text-white shadow-[0_0_0_3px_var(--lesson-surface),0_0_0_6px_var(--lesson-primary)]'
                            : 'bg-lesson-primary-soft text-lesson-primary-dark hover:bg-lesson-border',
                        )}
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

          <section
            aria-labelledby="step-heading"
            className="rounded-[1.75rem] border-2 border-lesson-border bg-lesson-surface p-5 shadow-[0_18px_40px_-24px_rgb(20_83_45/0.45)] sm:p-8 md:rounded-[2rem] md:p-12"
          >
            <h2
              className="mb-6 inline-flex items-center rounded-full bg-lesson-accent/70 px-4 py-1.5 text-base font-extrabold text-lesson-primary-dark"
              id="step-heading"
            >
              Bước {step} / {LESSON_STEP_COUNT}
            </h2>

            <div className="min-h-56" data-testid="step-content">
              {hasContent ? (
                <RichText className="lesson-prose" data={content as SerializedEditorState} />
              ) : (
                <p className="text-lg font-semibold text-lesson-muted">Bước này chưa có nội dung.</p>
              )}
            </div>

            <div className="mt-10 flex items-center justify-between gap-3 border-t-2 border-lesson-primary-soft pt-6">
              <StepButton href={step > 1 ? stepHref(lesson.id, step - 1) : null} variant="outline">
                <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={2.75} />
                Trước
              </StepButton>
              <StepButton
                href={step < LESSON_STEP_COUNT ? stepHref(lesson.id, step + 1) : null}
                variant="primary"
              >
                Tiếp
                <ArrowRight aria-hidden="true" className="size-5" strokeWidth={2.75} />
              </StepButton>
            </div>
          </section>
        </div>
      </div>
    </main>
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
  const className = cn(
    'inline-flex h-14 min-w-32 items-center justify-center gap-2 rounded-full px-6 text-lg font-extrabold transition sm:min-w-40',
    focusRing,
    variant === 'primary'
      ? 'bg-lesson-primary text-white shadow-[0_8px_18px_-10px_rgb(21_128_61/0.9)] hover:bg-lesson-primary-dark'
      : 'border-2 border-lesson-border bg-lesson-surface text-lesson-primary-dark hover:bg-lesson-primary-soft',
    !href && 'pointer-events-none cursor-not-allowed opacity-45 shadow-none',
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
