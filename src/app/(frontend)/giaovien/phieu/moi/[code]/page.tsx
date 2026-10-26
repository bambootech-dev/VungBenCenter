import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { BackLink } from '@/components/BackLink'
import { PageHeader } from '@/components/PageHeader'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'
import { getTemplate } from '@/worksheetTemplates/definitions'

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
    <div className="container py-4 py-md-5">
      <BackLink href="/giaovien/phieu/moi">Chọn mẫu khác</BackLink>
      <PageHeader eyebrow="Điền phiếu" title={template.title} />
      <TemplateForm teacherName={user.name || user.email} template={template} />
    </div>
  )
}
