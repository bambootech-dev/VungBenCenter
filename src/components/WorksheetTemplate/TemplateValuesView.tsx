import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { visuallyHidden } from '@mui/utils'
import React from 'react'

import { formatValue, readRows, readScalar, rowHeader } from '@/worksheetTemplates/snapshot'
import type { TableField, TemplateValues, WorksheetTemplate } from '@/worksheetTemplates/types'

import { TableHeader } from './TableHeader'
import { TemplateChart } from './TemplateChart'
import { worksheetTableSx } from './tableStyles'

type Props = {
  teacherName: string
  template: WorksheetTemplate
  values: TemplateValues
}

const EMPTY = 'Không nhập'

const TableView = ({ field, values }: { field: TableField; values: TemplateValues }) => {
  const rows = readRows(values[field.key])

  if (rows.length === 0) {
    return (
      <Typography
        color="text.secondary"
        sx={{ border: 1, borderColor: 'divider', borderRadius: 3, fontStyle: 'italic', p: 2 }}
      >
        Không có dòng nào.
      </Typography>
    )
  }

  return (
    <>
      <Paper sx={{ borderRadius: 3, overflowX: 'auto' }} variant="outlined">
        <Box component="table" data-testid={`table-${field.key}`} sx={worksheetTableSx}>
          <Box component="caption" sx={visuallyHidden}>
            {field.label}
          </Box>
          <TableHeader columns={field.columns} leadingLabel={field.mode === 'fixed' ? rowHeader(field) : undefined} />
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {field.mode === 'fixed' && (
                  <Box component="th" scope="row" sx={{ whiteSpace: 'nowrap' }}>
                    {(field.rowLabel ?? '{n}').replace('{n}', String(index + 1))}
                  </Box>
                )}
                {field.columns.map((column) => (
                  <Box
                    component="td"
                    key={column.key}
                    sx={column.type === 'text' && column.maxLength && column.maxLength > 50 ? { minWidth: 224, textAlign: 'left' } : undefined}
                  >
                    {formatValue(row[column.key] ?? null, column.type, column.suffix)}
                  </Box>
                ))}
              </tr>
            ))}
          </tbody>
        </Box>
      </Paper>
      {field.chart && (
        <Paper sx={{ borderRadius: 3, mt: 2.5, p: 2 }} variant="outlined">
          <TemplateChart field={field} rows={rows} />
        </Paper>
      )}
    </>
  )
}

/** Hiển thị phiếu đã nộp theo bản chụp mẫu lúc nộp (chỉ đọc). */
export const TemplateValuesView = ({ teacherName, template, values }: Props) => (
  <Box data-testid="template-values" sx={{ display: 'grid', gap: 3 }}>
    {template.sections.map((section) => (
      <Card aria-labelledby={`section-${section.key}`} component="section" key={section.key}>
        <CardContent sx={{ display: 'grid', gap: 2.5 }}>
          <Typography component="h2" id={`section-${section.key}`} variant="h5">
            {section.title}
          </Typography>

          {(section.accountFields?.length || section.fields.some((field) => field.kind === 'field')) && (
            <Box component="dl" sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, m: 0 }}>
              {section.accountFields?.map((item) => (
                <div key={item.label}>
                  <Typography color="text.secondary" component="dt" variant="body2">
                    {item.label}
                  </Typography>
                  <Typography component="dd" sx={{ fontWeight: 500, m: 0, mt: 0.5 }}>
                    {teacherName}
                  </Typography>
                </div>
              ))}
              {section.fields.map((field) => {
                if (field.kind !== 'field') return null

                const value = formatValue(readScalar(values[field.key]), field.type)

                return (
                  <Box data-field={field.key} key={field.key} sx={field.type === 'textarea' ? { gridColumn: { sm: '1 / -1' } } : undefined}>
                    <Typography color="text.secondary" component="dt" variant="body2">
                      {field.label}
                    </Typography>
                    <Typography
                      color={value ? 'text.primary' : 'text.secondary'}
                      component="dd"
                      sx={{ fontStyle: value ? undefined : 'italic', fontWeight: 500, m: 0, mt: 0.5, overflowWrap: 'anywhere', whiteSpace: 'pre-line' }}
                    >
                      {value || EMPTY}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          )}

          {section.fields.map((field) => (field.kind === 'table' ? <TableView field={field} key={field.key} values={values} /> : null))}
        </CardContent>
      </Card>
    ))}
  </Box>
)
