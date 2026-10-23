import type { Metadata } from 'next'
import { CheckCircle2, ChevronLeft, Clock, UserRound } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { cn } from '@/utilities/ui'
import { TemplateValuesView } from '@/components/WorksheetTemplate/TemplateValuesView'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'
import { readTemplateSnapshot, readTemplateValues } from '@/worksheetTemplates/snapshot'

import { cardClass, focusRing, formatDateTime, pageTitleClass, pillClass } from '../../_components/teacherUi'

export const metadata: Metadata = {
  title: 'Bài đã nộp',
}

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SubmissionDetailPage({ params, searchParams }: Props) {
  const { payload, user } = await requireActiveTeacher()
  const { id } = await params
  const justSubmitted = (await searchParams)['vua-nop'] === '1'

  if (!/^\d+$/.test(id)) {
    notFound()
  }

  // overrideAccess: false → bài của Giáo viên khác không bao giờ được trả về, kể cả khi đổi ID trên URL
  const {
    docs: [submission],
  } = await payload.find({
    collection: 'worksheet-submissions',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    populate: {
      users: { name: true },
    },
    user,
    where: { id: { equals: Number(id) } },
  })

  if (!submission) {
    notFound()
  }

  // Phiếu theo mẫu hệ thống: hiển thị theo bản chụp mẫu lúc nộp; bài kiểu cũ: theo bản chụp worksheet
  const template = readTemplateSnapshot(submission.templateSnapshot)
  const snapshot = submission.worksheetSnapshot
  const title = submission.title ?? snapshot?.title ?? 'Phiếu'
  const teacherName =
    submission.teacher && typeof submission.teacher === 'object' ? submission.teacher.name : user.name
  // Ghép câu trả lời theo mã câu hỏi của bản chụp đề, không theo vị trí
  const answers = new Map((submission.answers ?? []).map((answer) => [answer.questionKey, answer.value]))

  return (
    <main className="flex-1">
      <div className="lesson-container py-6 md:py-10">
        <div className={cn('mx-auto', template ? 'max-w-6xl' : 'max-w-3xl')}>
          <Link
            className={cn(
              'mb-5 inline-flex min-h-11 items-center gap-1 rounded-full pr-3 text-base font-bold text-lesson-primary-dark hover:underline',
              focusRing,
            )}
            href="/giaovien/bai-da-nop"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
            Bài đã nộp
          </Link>

          {justSubmitted && (
            <div
              className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-lesson-primary/40 bg-lesson-primary-soft p-4 text-base font-bold text-lesson-primary-dark"
              data-testid="submission-success"
              role="status"
            >
              <CheckCircle2 aria-hidden="true" className="size-6 shrink-0 text-lesson-primary" />
              Đã nộp phiếu thành công.
            </div>
          )}

          <header className="mb-6">
            <p className={`${pillClass} mb-3`}>Bài đã nộp</p>
            <h1 className={pageTitleClass} data-testid="submission-title">
              {title}
            </h1>
            <dl className="mt-4 flex flex-col gap-2 text-base font-bold text-lesson-muted sm:flex-row sm:gap-6">
              <div className="inline-flex items-center gap-1.5">
                <dt className="inline-flex items-center gap-1.5">
                  <UserRound aria-hidden="true" className="size-5" strokeWidth={2.5} />
                  Người nộp:
                </dt>
                <dd className="text-lesson-primary-dark" data-testid="submission-teacher">
                  {teacherName}
                </dd>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <dt className="inline-flex items-center gap-1.5">
                  <Clock aria-hidden="true" className="size-5" strokeWidth={2.5} />
                  Nộp lúc:
                </dt>
                <dd className="text-lesson-primary-dark" data-testid="submission-time">
                  <time dateTime={submission.submittedAt}>{formatDateTime(submission.submittedAt)}</time>
                </dd>
              </div>
            </dl>
          </header>

          {template && (
            <TemplateValuesView
              teacherName={teacherName}
              template={template}
              values={readTemplateValues(submission.data)}
            />
          )}

          {!template && snapshot?.instructions && (
            <section aria-label="Hướng dẫn" className={cn(cardClass, 'mb-6 p-5 sm:p-6')}>
              <h2 className="mb-2 text-lg font-extrabold text-lesson-primary-dark">Hướng dẫn</h2>
              <p className="whitespace-pre-line text-base font-semibold text-lesson-muted">
                {snapshot.instructions}
              </p>
            </section>
          )}

          {!template && (
          <ol className="space-y-5" data-testid="submission-answers">
            {(snapshot?.questions ?? []).map((question, index) => {
              const answer = answers.get(question.key)

              return (
                <li className={cn(cardClass, 'p-5 sm:p-6')} data-question-key={question.key} key={question.key}>
                  <h2 className="mb-3 text-lg font-extrabold text-lesson-primary-dark">
                    <span className="mr-2 text-lesson-primary">{index + 1}.</span>
                    {question.label}
                    {question.required && (
                      <>
                        <span aria-hidden="true" className="ml-1 text-red-700">
                          *
                        </span>
                        <span className="sr-only"> (bắt buộc)</span>
                      </>
                    )}
                  </h2>
                  {answer ? (
                    <p
                      className="whitespace-pre-line break-words rounded-2xl bg-lesson-page p-4 text-base font-semibold text-lesson-primary-dark"
                      data-testid="submission-answer"
                    >
                      {answer}
                    </p>
                  ) : (
                    <p
                      className="rounded-2xl border-2 border-dashed border-lesson-border p-4 text-base font-bold italic text-lesson-muted"
                      data-testid="submission-no-answer"
                    >
                      Không trả lời
                    </p>
                  )}
                </li>
              )
            })}
          </ol>
          )}
        </div>
      </div>
    </main>
  )
}
