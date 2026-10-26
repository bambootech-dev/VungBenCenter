import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { BackLink } from '@/components/BackLink'
import { PageHeader } from '@/components/PageHeader'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'
import { WORKSHEET_TEMPLATES } from '@/worksheetTemplates/definitions'

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
    <div className="container py-4 py-md-5">
      <BackLink href="/giaovien/phieu">Phiếu</BackLink>
      <PageHeader eyebrow="Tạo phiếu" title="Chọn mẫu phiếu" />

      <ul className="row row-cols-1 row-cols-md-2 g-4 list-unstyled mb-0" data-testid="template-list">
        {WORKSHEET_TEMPLATES.map((template) => (
          <li className="col" key={template.code}>
            <article className="card h-100 shadow-sm" data-testid="template-card">
              <div className="card-body d-flex flex-column gap-3 p-4">
                <div className="flex-grow-1">
                  <h2 className="h4">{template.title}</h2>
                  <p className="text-body-secondary mb-0">{template.description}</p>
                </div>
                <Link
                  aria-label={`Điền ${template.title}`}
                  className="btn btn-primary align-self-start"
                  href={`/giaovien/phieu/moi/${template.code}`}
                >
                  Điền phiếu này
                  <i aria-hidden="true" className="bi bi-arrow-right ms-2" />
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  )
}
