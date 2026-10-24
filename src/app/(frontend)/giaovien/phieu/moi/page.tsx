import type { Metadata } from 'next'
import { ArrowRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { cn } from '@/utilities/ui'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'
import { WORKSHEET_TEMPLATES } from '@/worksheetTemplates/definitions'

import { cardClass, focusRing, pageTitleClass, pillClass, primaryButtonClass } from '../../_components/teacherUi'

export const metadata: Metadata = {
  title: 'Tạo phiếu',
}

export default async function ChooseTemplatePage() {
  await requireActiveTeacher()

  // Chỉ có một mẫu thì mở thẳng form
  if (WORKSHEET_TEMPLATES.length === 1) {
    redirect(`/giaovien/phieu/moi/${WORKSHEET_TEMPLATES[0].code}`)
  }

  return (
    <main className="flex-1">
      <div className="lesson-container py-6 md:py-10">
        <Link
          className={cn(
            'mb-5 inline-flex min-h-11 items-center gap-1 rounded-full pr-3 text-base font-bold text-lesson-primary-dark hover:underline',
            focusRing,
          )}
          href="/giaovien/phieu"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
          Phiếu
        </Link>

        <p className={`${pillClass} mb-3`}>Tạo phiếu</p>
        <h1 className={`${pageTitleClass} mb-8`}>Chọn mẫu phiếu</h1>

        <ul className="grid gap-5 md:grid-cols-2" data-testid="template-list">
          {WORKSHEET_TEMPLATES.map((template) => (
            <li key={template.code}>
              <article className={cn(cardClass, 'flex h-full flex-col gap-4 p-6')} data-testid="template-card">
                <div className="flex-1">
                  <h2 className="text-xl font-extrabold text-lesson-primary-dark">{template.title}</h2>
                  <p className="mt-2 text-base font-semibold text-lesson-muted">{template.description}</p>
                </div>
                <Link
                  aria-label={`Điền ${template.title}`}
                  className={cn(primaryButtonClass, 'self-start')}
                  href={`/giaovien/phieu/moi/${template.code}`}
                >
                  Điền phiếu này
                  <ArrowRight aria-hidden="true" className="size-5" strokeWidth={2.75} />
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
