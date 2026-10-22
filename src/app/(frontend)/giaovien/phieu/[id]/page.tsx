import type { Metadata } from 'next'
import { BookOpen, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { formatSoundLabel } from '@/collections/Lessons/sound'
import { cn } from '@/utilities/ui'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'

import { cardClass, focusRing, pageTitleClass, pillClass } from '../../_components/teacherUi'
import { WorksheetForm } from './WorksheetForm'

export const metadata: Metadata = {
  title: 'Điền phiếu',
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function WorksheetFillPage({ params }: Props) {
  const { payload, user } = await requireActiveTeacher()
  const { id } = await params

  // ID của Postgres là số nguyên; giá trị khác không bao giờ khớp phiếu nào
  if (!/^\d+$/.test(id)) {
    notFound()
  }

  const {
    docs: [worksheet],
  } = await payload.find({
    collection: 'worksheets',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: { id: { equals: Number(id) } },
  })

  if (!worksheet) {
    notFound()
  }

  const lesson = worksheet.lesson && typeof worksheet.lesson === 'object' ? worksheet.lesson : null

  return (
    <main className="flex-1">
      <div className="lesson-container py-6 md:py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            className={cn(
              'mb-5 inline-flex min-h-11 items-center gap-1 rounded-full pr-3 text-base font-bold text-lesson-primary-dark hover:underline',
              focusRing,
            )}
            href="/giaovien/phieu"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
            Danh sách phiếu
          </Link>

          <header className="mb-6">
            <p className={`${pillClass} mb-3`}>Điền phiếu</p>
            <h1 className={pageTitleClass}>{worksheet.title}</h1>
            {lesson && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-base font-bold text-lesson-primary">
                <BookOpen aria-hidden="true" className="size-5" strokeWidth={2.5} />
                Bài học: {formatSoundLabel(lesson.sound)}
              </p>
            )}
          </header>

          {worksheet.instructions && (
            <section aria-label="Hướng dẫn" className={cn(cardClass, 'mb-6 p-5 sm:p-6')}>
              <h2 className="mb-2 text-lg font-extrabold text-lesson-primary-dark">Hướng dẫn</h2>
              <p className="whitespace-pre-line text-base font-semibold text-lesson-muted">
                {worksheet.instructions}
              </p>
            </section>
          )}

          <WorksheetForm
            questions={worksheet.questions.map(({ key, label, required }) => ({
              key,
              label,
              required: Boolean(required),
            }))}
            worksheetId={worksheet.id}
          />
        </div>
      </div>
    </main>
  )
}
