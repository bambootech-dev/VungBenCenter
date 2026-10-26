import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { BackLink } from '@/components/BackLink'
import { PageHeader } from '@/components/PageHeader'
import { TemplateValuesView } from '@/components/WorksheetTemplate/TemplateValuesView'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'
import { readTemplateSnapshot, readTemplateValues } from '@/worksheetTemplates/snapshot'

import { formatDateTime } from '../../_components/teacherUi'

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
    <div className="container py-4 py-md-5">
      <BackLink href="/giaovien/bai-da-nop">Bài đã nộp</BackLink>

      {justSubmitted && (
        <div className="alert alert-success d-flex align-items-center gap-2 mt-2" data-testid="submission-success" role="status">
          <i aria-hidden="true" className="bi bi-check-circle-fill fs-5" />
          Đã nộp phiếu thành công.
        </div>
      )}

      <PageHeader className="mb-3" eyebrow="Bài đã nộp" title={title} titleTestId="submission-title" />

      <dl className="d-flex flex-column flex-sm-row gap-2 column-gap-sm-4 fw-bold text-body-secondary mb-4">
        <div className="d-flex gap-2">
          <dt className="fw-bold">
            <i aria-hidden="true" className="bi bi-person-fill me-1" />
            Người nộp:
          </dt>
          <dd className="text-body-emphasis mb-0" data-testid="submission-teacher">
            {teacherName}
          </dd>
        </div>
        <div className="d-flex gap-2">
          <dt className="fw-bold">
            <i aria-hidden="true" className="bi bi-clock-fill me-1" />
            Nộp lúc:
          </dt>
          <dd className="text-body-emphasis mb-0" data-testid="submission-time">
            <time dateTime={submission.submittedAt}>{formatDateTime(submission.submittedAt)}</time>
          </dd>
        </div>
      </dl>

      {template && (
        <TemplateValuesView teacherName={teacherName} template={template} values={readTemplateValues(submission.data)} />
      )}

      {!template && (
        <div className="col-lg-9">
          {snapshot?.instructions && (
            <section aria-label="Hướng dẫn" className="card card-body shadow-sm mb-4">
              <h2 className="h5">Hướng dẫn</h2>
              <p className="text-body-secondary text-pre-line mb-0">{snapshot.instructions}</p>
            </section>
          )}

          <ol className="list-unstyled d-grid gap-4 mb-0" data-testid="submission-answers">
            {(snapshot?.questions ?? []).map((question, index) => {
              const answer = answers.get(question.key)

              return (
                <li className="card card-body shadow-sm" data-question-key={question.key} key={question.key}>
                  <h2 className="h5 mb-3">
                    <span className="text-primary me-2">{index + 1}.</span>
                    {question.label}
                    {question.required && (
                      <>
                        <span aria-hidden="true" className="text-danger ms-1">
                          *
                        </span>
                        <span className="visually-hidden"> (bắt buộc)</span>
                      </>
                    )}
                  </h2>
                  {answer ? (
                    <p className="bg-body-tertiary rounded p-3 text-pre-line text-break mb-0" data-testid="submission-answer">
                      {answer}
                    </p>
                  ) : (
                    <p className="border rounded p-3 fst-italic text-body-secondary mb-0" data-testid="submission-no-answer">
                      Không trả lời
                    </p>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
