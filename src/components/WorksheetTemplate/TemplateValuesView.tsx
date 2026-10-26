import clsx from 'clsx'
import React from 'react'

import { formatValue, readRows, readScalar, rowHeader } from '@/worksheetTemplates/snapshot'
import type { TableField, TemplateValues, WorksheetTemplate } from '@/worksheetTemplates/types'

import { TableHeader } from './TableHeader'
import { TemplateChart } from './TemplateChart'

type Props = {
  teacherName: string
  template: WorksheetTemplate
  values: TemplateValues
}

const EMPTY = 'Không nhập'

const thClass = 'bg-primary-subtle text-primary-emphasis text-center small'

const TableView = ({ field, values }: { field: TableField; values: TemplateValues }) => {
  const rows = readRows(values[field.key])

  if (rows.length === 0) {
    return <p className="border rounded p-3 fst-italic text-body-secondary mb-0">Không có dòng nào.</p>
  }

  return (
    <>
      <div className="table-responsive border rounded">
        <table className="table table-bordered table-hover table-sm align-middle text-center mb-0" data-testid={`table-${field.key}`}>
          <caption className="visually-hidden">{field.label}</caption>
          <TableHeader
            cellClassName={thClass}
            columns={field.columns}
            leadingLabel={field.mode === 'fixed' ? rowHeader(field) : undefined}
          />
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {field.mode === 'fixed' && (
                  <th className={clsx(thClass, 'text-nowrap')} scope="row">
                    {(field.rowLabel ?? '{n}').replace('{n}', String(index + 1))}
                  </th>
                )}
                {field.columns.map((column) => (
                  <td
                    className={clsx(column.type === 'text' && column.maxLength && column.maxLength > 50 && 'cell-w-lg text-start')}
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
        <div className="border rounded bg-body p-3 mt-4">
          <TemplateChart field={field} rows={rows} />
        </div>
      )}
    </>
  )
}

/** Hiển thị phiếu đã nộp theo bản chụp mẫu lúc nộp (chỉ đọc). */
export const TemplateValuesView = ({ teacherName, template, values }: Props) => (
  <div className="d-grid gap-4" data-testid="template-values">
    {template.sections.map((section) => (
      <section aria-labelledby={`section-${section.key}`} className="card shadow-sm" key={section.key}>
        <div className="card-body p-4">
          <h2 className="h4 mb-3" id={`section-${section.key}`}>
            {section.title}
          </h2>

          {(section.accountFields?.length || section.fields.some((field) => field.kind === 'field')) && (
            <dl className="row g-3 mb-0">
              {section.accountFields?.map((item) => (
                <div className="col-12 col-sm-6" key={item.label}>
                  <dt className="small fw-bold text-body-secondary">{item.label}</dt>
                  <dd className="fw-bold text-body-emphasis mt-1 mb-0">{teacherName}</dd>
                </div>
              ))}
              {section.fields.map((field) => {
                if (field.kind !== 'field') return null

                const value = formatValue(readScalar(values[field.key]), field.type)

                return (
                  <div className={field.type === 'textarea' ? 'col-12' : 'col-12 col-sm-6'} data-field={field.key} key={field.key}>
                    <dt className="small fw-bold text-body-secondary">{field.label}</dt>
                    <dd
                      className={clsx(
                        'fw-bold text-pre-line text-break mt-1 mb-0',
                        value ? 'text-body-emphasis' : 'fst-italic text-body-secondary',
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
              <div className="mt-3" key={field.key}>
                <TableView field={field} values={values} />
              </div>
            ) : null,
          )}
        </div>
      </section>
    ))}
  </div>
)
