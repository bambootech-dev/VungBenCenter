import type { Metadata } from 'next'
import { ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { formatSoundLabel } from '@/collections/Lessons/sound'
import { cn } from '@/utilities/ui'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'

import { EmptyState } from '../_components/EmptyState'
import { Pagination } from '../_components/Pagination'
import { cardClass, pageTitleClass, parsePage, pillClass, primaryButtonClass } from '../_components/teacherUi'

export const metadata: Metadata = {
  title: 'Phiếu',
}

const PAGE_SIZE = 12

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function WorksheetListPage({ searchParams }: Props) {
  const { payload, user } = await requireActiveTeacher()
  const page = parsePage((await searchParams).page)

  const result = await payload.find({
    collection: 'worksheets',
    depth: 1,
    limit: PAGE_SIZE,
    overrideAccess: false,
    page,
    select: {
      instructions: true,
      lesson: true,
      title: true,
    },
    sort: '-createdAt',
    user,
  })

  return (
    <main className="flex-1">
      <div className="lesson-container py-10 md:py-14">
        <p className={`${pillClass} mb-3`}>Giáo viên</p>
        <h1 className={`${pageTitleClass} mb-8`}>Phiếu</h1>

        {result.docs.length === 0 ? (
          result.totalDocs === 0 ? (
            <EmptyState message="Chưa có phiếu nào." testId="worksheet-list-empty" />
          ) : (
            <EmptyState
              action={{ href: '/giaovien/phieu', label: 'Về trang đầu' }}
              message="Trang này không có phiếu."
              testId="worksheet-list-empty"
            />
          )
        ) : (
          <ul className="grid gap-5 md:grid-cols-2" data-testid="worksheet-list">
            {result.docs.map((worksheet) => {
              const lesson =
                worksheet.lesson && typeof worksheet.lesson === 'object' ? worksheet.lesson : null

              return (
                <li key={worksheet.id}>
                  <article className={cn(cardClass, 'flex h-full flex-col gap-4 p-6')} data-testid="worksheet-card">
                    <div className="flex-1">
                      <h2 className="text-xl font-extrabold text-lesson-primary-dark">{worksheet.title}</h2>
                      {lesson && (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-lesson-primary">
                          <BookOpen aria-hidden="true" className="size-4" strokeWidth={2.5} />
                          Bài học: {formatSoundLabel(lesson.sound)}
                        </p>
                      )}
                      {worksheet.instructions && (
                        <p className="mt-3 line-clamp-2 text-base font-semibold text-lesson-muted">
                          {worksheet.instructions}
                        </p>
                      )}
                    </div>
                    <Link
                      aria-label={`Mở phiếu ${worksheet.title}`}
                      className={cn(primaryButtonClass, 'self-start')}
                      href={`/giaovien/phieu/${worksheet.id}`}
                    >
                      Mở phiếu
                      <ArrowRight aria-hidden="true" className="size-5" strokeWidth={2.75} />
                    </Link>
                  </article>
                </li>
              )
            })}
          </ul>
        )}

        <Pagination basePath="/giaovien/phieu" page={page} totalPages={result.totalPages} />
      </div>
    </main>
  )
}
