import React from 'react'

import { cardClass } from '@/components/ui/brand'
import { formatValue, readRows, readScalar, rowHeader } from '@/worksheetTemplates/snapshot'
import type { TableField, TemplateValues, WorksheetTemplate } from '@/worksheetTemplates/types'
import { cn } from '@/utilities/ui'

import { TableHeader } from './TableHeader'
import { TemplateChart } from './TemplateChart'

type Props = {
  teacherName: string
  template: WorksheetTemplate
  values: TemplateValues
}

const EMPTY = 'Không nhập'

const thClass =
  'border-2 border-lesson-border bg-lesson-primary-soft px-2 py-2 text-center text-sm font-extrabold text-lesson-primary-dark'
const tdClass = 'border-2 border-lesson-border px-2 py-2 text-center text-sm font-semibold text-lesson-primary-dark'

const TableView = ({ field, values }: { field: TableField; values: TemplateValues }) => {
  const rows = readRows(values[field.key])

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-lesson-border p-4 font-bold italic text-lesson-muted">
        Không có dòng nào.
      </p>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl">
        <table className="w-full border-collapse bg-lesson-surface" data-testid={`table-${field.key}`}>
          <caption className="sr-only">{field.label}</caption>
          <TableHeader
            cellClassName={thClass}
            columns={field.columns}
            leadingLabel={field.mode === 'fixed' ? rowHeader(field) : undefined}
          />
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {field.mode === 'fixed' && (
                  <th className={cn(thClass, 'whitespace-nowrap')} scope="row">
                    {(field.rowLabel ?? '{n}').replace('{n}', String(index + 1))}
                  </th>
                )}
                {field.columns.map((column) => (
                  <td
                    className={cn(tdClass, column.type === 'text' && column.maxLength && column.maxLength > 50 && 'min-w-56 text-left')}
                    key={column.key}
                  >
                    {formatValue(row[column.key] ?? null, column.type, column.suffix)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {field.chart && (
        <div className="mt-5 rounded-2xl border-2 border-lesson-border bg-lesson-surface p-3">
          <TemplateChart field={field} rows={rows} />
        </div>
      )}
    </>
  )
}

/** Hiển thị phiếu đã nộp theo bản chụp mẫu lúc nộp (chỉ đọc). */
export const TemplateValuesView = ({ teacherName, template, values }: Props) => (
  <div className="space-y-5" data-testid="template-values">
    {template.sections.map((section) => (
      <section aria-labelledby={`section-${section.key}`} className={cn(cardClass, 'p-5 sm:p-6')} key={section.key}>
        <h2 className="mb-4 text-xl font-extrabold text-lesson-primary-dark" id={`section-${section.key}`}>
          {section.title}
        </h2>

        {(section.accountFields?.length || section.fields.some((field) => field.kind === 'field')) && (
          <dl className="grid gap-4 sm:grid-cols-2">
            {section.accountFields?.map((item) => (
              <div key={item.label}>
                <dt className="text-sm font-bold text-lesson-muted">{item.label}</dt>
                <dd className="mt-1 text-base font-bold text-lesson-primary-dark">{teacherName}</dd>
              </div>
            ))}
            {section.fields.map((field) => {
              if (field.kind !== 'field') return null

              const value = formatValue(readScalar(values[field.key]), field.type)

              return (
                <div className={field.type === 'textarea' ? 'sm:col-span-2' : undefined} data-field={field.key} key={field.key}>
                  <dt className="text-sm font-bold text-lesson-muted">{field.label}</dt>
                  <dd
                    className={cn(
                      'mt-1 whitespace-pre-line break-words text-base font-bold',
                      value ? 'text-lesson-primary-dark' : 'italic text-lesson-muted',
                    )}
                  >
                    {value || EMPTY}
                  </dd>
                </div>
              )
            })}
          </dl>
        )}

        {section.fields.map((field) =>
          field.kind === 'table' ? (
            <div className="mt-2" key={field.key}>
              <TableView field={field} values={values} />
            </div>
          ) : null,
        )}
      </section>
    ))}
  </div>
)
