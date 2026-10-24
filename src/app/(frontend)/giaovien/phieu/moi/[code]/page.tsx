import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { cn } from '@/utilities/ui'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'
import { getTemplate } from '@/worksheetTemplates/definitions'

import { focusRing, pageTitleClass, pillClass } from '../../../_components/teacherUi'
import { TemplateForm } from './TemplateForm'

export const metadata: Metadata = {
  title: 'Điền phiếu',
}

type Props = {
  params: Promise<{ code: string }>
}

// Chỉ mở form, chưa tạo bài nộp nào; bài nộp được tạo khi giáo viên bấm "Nộp phiếu"
export default async function FillTemplatePage({ params }: Props) {
  const { user } = await requireActiveTeacher()
  const template = getTemplate((await params).code)

  if (!template) {
    notFound()
  }

  return (
    <main className="flex-1">
      <div className="lesson-container py-6 md:py-10">
        <div className="mx-auto max-w-6xl">
          <Link
            className={cn(
              'mb-5 inline-flex min-h-11 items-center gap-1 rounded-full pr-3 text-base font-bold text-lesson-primary-dark hover:underline',
              focusRing,
            )}
            href="/giaovien/phieu/moi"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
            Chọn mẫu khác
          </Link>

          <header className="mb-6">
            <p className={`${pillClass} mb-3`}>Điền phiếu</p>
            <h1 className={pageTitleClass}>{template.title}</h1>
          </header>

          <TemplateForm teacherName={user.name || user.email} template={template} />
        </div>
      </div>
    </main>
  )
}
