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
    <main className="flex-1 bg-emerald-50/60">
      <div className="container max-w-4xl py-8 md:py-12">
        <Link
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-emerald-800 hover:underline"
          href="/bai-hoc"
        >
          <ChevronLeft className="size-4" />
          Danh sách bài học
        </Link>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950 md:text-4xl">
            {formatSoundLabel(lesson.sound)}
          </h1>

          <nav aria-label="Các bước">
            <ol className="flex flex-wrap gap-2">
              {LESSON_STEP_KEYS.map((key, index) => {
                const number = index + 1
                const isCurrent = number === step

                return (
                  <li key={key}>
                    <Link
                      aria-current={isCurrent ? 'step' : undefined}
                      aria-label={`Bước ${number}`}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-full text-sm font-semibold transition',
                        isCurrent
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100',
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
          className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm md:p-10"
        >
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-700" id="step-heading">
            Bước {step} / {LESSON_STEP_COUNT}
          </h2>

          <div className="min-h-48" data-testid="step-content">
            {hasContent ? (
              <RichText
                className="text-lg leading-relaxed text-emerald-950 [&_a]:underline [&_h1]:mb-4 [&_h1]:text-4xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:text-3xl [&_h2]:font-bold [&_h3]:mb-3 [&_h3]:text-2xl [&_h3]:font-semibold [&_img]:my-4 [&_img]:rounded-xl [&_li]:ml-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc"
                data={content as SerializedEditorState}
              />
            ) : (
              <p className="text-muted-foreground">Bước này chưa có nội dung.</p>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-emerald-100 pt-6">
            <StepButton href={step > 1 ? stepHref(lesson.id, step - 1) : null} variant="outline">
              <ArrowLeft className="size-4" />
              Trước
            </StepButton>
            <StepButton
              href={step < LESSON_STEP_COUNT ? stepHref(lesson.id, step + 1) : null}
              variant="primary"
            >
              Tiếp
              <ArrowRight className="size-4" />
            </StepButton>
          </div>
        </section>
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
    'inline-flex h-11 min-w-28 items-center justify-center gap-2 rounded-xl px-5 font-semibold transition',
    variant === 'primary'
      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
      : 'border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50',
    !href && 'pointer-events-none opacity-40',
  )

  // Bước đầu/cuối: nút vẫn hiển thị nhưng bị vô hiệu hóa
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
