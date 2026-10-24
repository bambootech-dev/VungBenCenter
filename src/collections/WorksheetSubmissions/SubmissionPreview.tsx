'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

import { TableHeader } from '@/components/WorksheetTemplate/TableHeader'
import { TemplateChart } from '@/components/WorksheetTemplate/TemplateChart'
import {
  formatValue,
  readRows,
  readScalar,
  readTemplateSnapshot,
  readTemplateValues,
  rowHeader,
} from '@/worksheetTemplates/snapshot'

// /admin không nạp Tailwind của frontend: dùng biến màu của Payload để hợp theme quản trị
const border = '1px solid var(--theme-elevation-150)'
const cell: React.CSSProperties = { border, padding: '6px 8px', textAlign: 'center', fontSize: 13 }
const headCell: React.CSSProperties = { ...cell, background: 'var(--theme-elevation-50)', fontWeight: 600 }

/** Hiển thị phiếu đã nộp trong /admin theo bản chụp mẫu lúc nộp (chỉ đọc). */
export const SubmissionPreview = () => {
  const snapshotValue = useFormFields(([fields]) => fields.templateSnapshot?.value)
  const dataValue = useFormFields(([fields]) => fields.data?.value)
  const template = readTemplateSnapshot(snapshotValue)
  const values = readTemplateValues(dataValue)

  if (!template) return null

  return (
    <div className="field-type" style={{ display: 'grid', gap: 24 }}>
      <p style={{ color: 'var(--theme-elevation-500)', margin: 0 }}>
        {template.title} · mẫu {template.code} (phiên bản {template.version})
      </p>

      {template.sections.map((section) => (
        <section key={section.key} style={{ border, borderRadius: 4, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>{section.title}</h3>

          <dl style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', margin: 0 }}>
            {section.accountFields?.map((item) => (
              <div key={item.label}>
                <dt style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>{item.label}</dt>
                <dd style={{ margin: 0 }}>Giáo viên nộp (ở trên)</dd>
              </div>
            ))}
            {section.fields.map((field) =>
              field.kind === 'field' ? (
                <div key={field.key} style={field.type === 'textarea' ? { gridColumn: '1 / -1' } : undefined}>
                  <dt style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>{field.label}</dt>
                  <dd style={{ margin: 0, whiteSpace: 'pre-line' }}>
                    {formatValue(readScalar(values[field.key]), field.type) || '—'}
                  </dd>
                </div>
              ) : null,
            )}
          </dl>

          {section.fields.map((field) => {
            if (field.kind !== 'table') return null

            const rows = readRows(values[field.key])

            return (
              <div key={field.key} style={{ marginTop: 12 }}>
                {rows.length === 0 ? (
                  <p style={{ color: 'var(--theme-elevation-500)' }}>Không có dòng nào.</p>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                        <TableHeader
                          cellStyle={headCell}
                          columns={field.columns}
                          leadingLabel={field.mode === 'fixed' ? rowHeader(field) : '#'}
                        />
                        <tbody>
                          {rows.map((row, index) => (
                            <tr key={index}>
                              <th scope="row" style={headCell}>
                                {field.mode === 'fixed'
                                  ? (field.rowLabel ?? '{n}').replace('{n}', String(index + 1))
                                  : index + 1}
                              </th>
                              {field.columns.map((column) => (
                                <td key={column.key} style={cell}>
                                  {formatValue(row[column.key] ?? null, column.type, column.suffix)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {field.chart && (
                      <div style={{ marginTop: 12, maxWidth: 720 }}>
                        <TemplateChart field={field} rows={rows} />
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
