'use client'

import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import SendRounded from '@mui/icons-material/SendRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import FormLabel from '@mui/material/FormLabel'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import OutlinedInput from '@mui/material/OutlinedInput'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { visuallyHidden } from '@mui/utils'
import { useRouter } from 'next/navigation'
import React, { useRef, useState, useTransition } from 'react'

import { submitWorksheet, type SubmitWorksheetResult } from '@/actions/submitWorksheet'
import { TableHeader } from '@/components/WorksheetTemplate/TableHeader'
import { worksheetTableSx } from '@/components/WorksheetTemplate/tableStyles'
import { rowHeader } from '@/worksheetTemplates/snapshot'
import type { ScalarField, TableColumn, TableField, WorksheetTemplate } from '@/worksheetTemplates/types'
import { normalizeTemplateValues } from '@/worksheetTemplates/validate'

import { NAV_BAR_HEIGHT } from '../../../_components/TeacherNav'

type Props = {
  teacherName: string
  template: WorksheetTemplate
}

type FormError = Extract<SubmitWorksheetResult, { ok: false }>
type Row = Record<string, string>

// id ô nhập theo đường dẫn lỗi của server (values.<key> / values.<bảng>.<dòng>.<cột>)
const inputId = (path: string) => `f-${path.replace(/[^a-zA-Z0-9-]/g, '-')}`

const emptyRow = (field: TableField): Row => Object.fromEntries(field.columns.map((column) => [column.key, '']))

const initialTables = (template: WorksheetTemplate) => {
  const tables: Record<string, Row[]> = {}

  for (const field of template.sections.flatMap((section) => section.fields)) {
    if (field.kind === 'table') {
      tables[field.key] = Array.from({ length: field.mode === 'fixed' ? field.rows : 1 }, () => emptyRow(field))
    }
  }

  return tables
}

const columnMinWidth = (column: TableColumn) =>
  column.maxLength && column.maxLength > 50 ? 224 : column.group ? 52 : 84

const MONTHS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))

export const TemplateForm = ({ teacherName, template }: Props) => {
  const router = useRouter()
  const [scalars, setScalars] = useState<Record<string, string>>({})
  const [tables, setTables] = useState<Record<string, Row[]>>(() => initialTables(template))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<FormError | null>(null)
  const [isPending, startTransition] = useTransition()
  // Chặn bấm liên tiếp trước khi React kịp render trạng thái đang gửi
  const submitting = useRef(false)
  const errorRef = useRef<HTMLDivElement>(null)

  const values = () => ({ ...scalars, ...tables })

  const clearError = (path: string) => {
    if (errors[path]) setErrors(({ [path]: _removed, ...rest }) => rest)
  }

  const setScalar = (key: string, value: string) => {
    setScalars((current) => ({ ...current, [key]: value }))
    clearError(`values.${key}`)
  }

  const setCell = (tableKey: string, rowIndex: number, columnKey: string, value: string) => {
    setTables((current) => ({
      ...current,
      [tableKey]: current[tableKey].map((row, index) => (index === rowIndex ? { ...row, [columnKey]: value } : row)),
    }))
    clearError(`values.${tableKey}.${rowIndex}.${columnKey}`)
  }

  const clearTableErrors = (tableKey: string) =>
    setErrors((current) =>
      Object.fromEntries(Object.entries(current).filter(([path]) => !path.startsWith(`values.${tableKey}.`))),
    )

  const addRow = (field: TableField) => {
    setTables((current) => ({ ...current, [field.key]: [...current[field.key], emptyRow(field)] }))
    // Đưa con trỏ tới ô đầu của dòng mới
    requestAnimationFrame(() =>
      document.getElementById(inputId(`values.${field.key}.${tables[field.key].length}.${field.columns[0].key}`))?.focus(),
    )
  }

  const removeRow = (field: TableField, rowIndex: number) => {
    setTables((current) => ({ ...current, [field.key]: current[field.key].filter((_, index) => index !== rowIndex) }))
    clearTableErrors(field.key)
  }

  const focusFirstError = (nextErrors: Record<string, string>) => {
    const first = Object.keys(nextErrors)
      .map((path) => document.getElementById(inputId(path)))
      .find(Boolean)

    if (first) {
      first.focus()
    } else {
      errorRef.current?.focus()
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (submitting.current) return

    // Cùng hàm kiểm tra với server
    const check = normalizeTemplateValues(template, values())
    const nextErrors = Object.fromEntries(check.errors.map((error) => [error.path, error.message]))
    setErrors(nextErrors)
    setFormError(null)

    if (check.errors.length > 0) {
      requestAnimationFrame(() => focusFirstError(nextErrors))
      return
    }

    submitting.current = true

    startTransition(async () => {
      let result: SubmitWorksheetResult

      try {
        result = await submitWorksheet({ templateCode: template.code, values: values() })
      } catch {
        // Mất mạng hoặc server không phản hồi: chưa chắc đã lưu, không báo thành công
        result = {
          ok: false,
          reason: 'error',
          message:
            'Không kết nối được tới máy chủ. Hãy kiểm tra mạng rồi bấm “Nộp phiếu” lần nữa. Nếu không chắc phiếu đã được nộp, hãy xem mục “Bài đã nộp” trước.',
        }
      }

      if (result.ok) {
        // replace: nút Quay lại không trở về form đã nộp; trang chi tiết chỉ đọc (GET)
        router.replace(`/giaovien/bai-da-nop/${result.id}?vua-nop=1`)
        return
      }

      submitting.current = false
      setErrors(result.fieldErrors ?? {})
      setFormError(result)
      requestAnimationFrame(() => focusFirstError(result.fieldErrors ?? {}))
    })
  }

  const helperText = (path: string) =>
    errors[path] ? <span id={`${inputId(path)}-error`}>{errors[path]}</span> : undefined

  const renderScalar = (field: ScalarField) => {
    const path = `values.${field.key}`
    const value = scalars[field.key] ?? ''
    const hasError = Boolean(errors[path])

    if (field.type === 'month') {
      // Tháng + năm tách riêng: input type="month" không có trên Safari
      const [year = '', month = ''] = value.split('-')
      const update = (nextYear: string, nextMonth: string) =>
        setScalar(field.key, nextYear || nextMonth ? `${nextYear}-${nextMonth}` : '')

      return (
        <FormControl
          aria-describedby={hasError ? `${inputId(path)}-error` : undefined}
          component="fieldset"
          error={hasError}
          key={field.key}
          required={field.required}
        >
          <FormLabel component="legend" sx={{ fontSize: '0.875rem', mb: 1 }}>
            {field.label}
          </FormLabel>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: '1fr 1fr' }}>
            <TextField
              error={hasError}
              id={inputId(path)}
              onChange={(event) => update(year, event.target.value)}
              select
              slotProps={{
                htmlInput: { 'aria-label': 'Tháng', 'aria-required': field.required },
                select: { native: true },
              }}
              value={month}
            >
              <option value="">Tháng</option>
              {MONTHS.map((item) => (
                <option key={item} value={item}>
                  Tháng {Number(item)}
                </option>
              ))}
            </TextField>
            <TextField
              error={hasError}
              id={`${inputId(path)}-year`}
              onChange={(event) => update(event.target.value.replace(/\D/g, ''), month)}
              placeholder="Năm"
              slotProps={{
                htmlInput: { 'aria-label': 'Năm', 'aria-required': field.required, inputMode: 'numeric', maxLength: 4 },
              }}
              value={year}
            />
          </Box>
          {hasError && <FormHelperText id={`${inputId(path)}-error`}>{errors[path]}</FormHelperText>}
        </FormControl>
      )
    }

    const isTextarea = field.type === 'textarea'

    return (
      <TextField
        error={hasError}
        fullWidth
        helperText={helperText(path)}
        id={inputId(path)}
        key={field.key}
        label={field.label}
        minRows={isTextarea ? 4 : undefined}
        multiline={isTextarea}
        onChange={(event) => setScalar(field.key, event.target.value)}
        required={field.required}
        slotProps={{
          formHelperText: { component: 'div' },
          htmlInput: { maxLength: field.maxLength },
          // Ô ngày/giờ luôn có chữ gợi ý của trình duyệt: nhãn nằm sẵn trên viền để không chồng lên
          inputLabel: field.type === 'date' || field.type === 'time' ? { shrink: true } : undefined,
        }}
        sx={isTextarea ? { gridColumn: { sm: '1 / -1' } } : undefined}
        type={isTextarea ? undefined : field.type}
        value={value}
      />
    )
  }

  const renderTable = (field: TableField) => {
    const rows = tables[field.key]
    const tableErrors = Object.entries(errors).filter(([path]) => path.startsWith(`values.${field.key}`))

    return (
      <Box key={field.key}>
        {field.columns.length > 4 && (
          <Typography color="text.secondary" sx={{ display: { sm: 'none' }, mb: 1 }} variant="body2">
            Vuốt ngang để xem hết các cột của bảng.
          </Typography>
        )}
        <Paper sx={{ borderRadius: 3, overflowX: 'auto' }} variant="outlined">
          <Box component="table" data-testid={`form-table-${field.key}`} sx={worksheetTableSx}>
            <Box component="caption" sx={visuallyHidden}>
              {field.label}
            </Box>
            <TableHeader columns={field.columns} leadingLabel={field.mode === 'fixed' ? rowHeader(field) : '#'} />
            <tbody>
              {rows.map((row, rowIndex) => {
                const rowName =
                  field.mode === 'fixed'
                    ? (field.rowLabel ?? '{n}').replace('{n}', String(rowIndex + 1))
                    : `Dòng ${rowIndex + 1}`

                return (
                  <tr key={rowIndex}>
                    <Box component="th" scope="row" sx={{ whiteSpace: 'nowrap' }}>
                      {field.mode === 'fixed' ? (
                        rowName
                      ) : (
                        <Box component="span" sx={{ alignItems: 'center', display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          {rowIndex + 1}
                          {rows.length > 1 && (
                            <IconButton
                              aria-label={`Xoá ${rowName.toLowerCase()}`}
                              onClick={() => removeRow(field, rowIndex)}
                              size="small"
                              sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'error.light', color: 'error.main' } }}
                            >
                              <DeleteOutlineRounded fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      )}
                    </Box>
                    {field.columns.map((column) => {
                      const path = `values.${field.key}.${rowIndex}.${column.key}`
                      const columnName = column.group ? `${column.group} ${column.label}` : column.label
                      const isLongText = Boolean(column.maxLength && column.maxLength > 50)

                      return (
                        <Box component="td" key={column.key} sx={{ minWidth: columnMinWidth(column), p: '4px !important' }}>
                          <OutlinedInput
                            error={Boolean(errors[path])}
                            fullWidth
                            id={inputId(path)}
                            inputProps={{
                              'aria-describedby': errors[path] ? `${inputId(path)}-error` : undefined,
                              'aria-label': `${rowName} – ${columnName}`,
                              inputMode: column.type === 'integer' ? 'numeric' : undefined,
                              maxLength: column.type === 'integer' ? 3 : column.maxLength,
                            }}
                            onChange={(event) => setCell(field.key, rowIndex, column.key, event.target.value)}
                            size="small"
                            sx={{
                              borderRadius: 1,
                              fontSize: '0.875rem',
                              '& input': { px: 1, py: 0.75, textAlign: isLongText ? 'left' : 'center' },
                              '&.Mui-error': { bgcolor: 'error.light' },
                            }}
                            value={row[column.key] ?? ''}
                          />
                        </Box>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </Box>
        </Paper>

        {tableErrors.length > 0 && (
          <Box component="ul" sx={{ color: 'error.main', display: 'grid', fontSize: '0.875rem', gap: 0.5, m: 0, mt: 1, pl: 2.5 }}>
            {tableErrors.map(([path, message]) => {
              const [, , rowIndex, columnKey] = path.split('.')
              const column = field.columns.find((item) => item.key === columnKey)
              const where =
                rowIndex === undefined
                  ? ''
                  : `${field.mode === 'fixed' ? (field.rowLabel ?? '{n}').replace('{n}', String(Number(rowIndex) + 1)) : `Dòng ${Number(rowIndex) + 1}`}${column ? ` – ${column.group ? `${column.group} ${column.label}` : column.label}` : ''}: `

              return (
                <li id={`${inputId(path)}-error`} key={path}>
                  {where}
                  {message}
                </li>
              )
            })}
          </Box>
        )}

        {field.mode === 'dynamic' && (
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 1.5 }}>
            <Button disabled={rows.length >= field.rows} onClick={() => addRow(field)} startIcon={<AddRounded />} variant="outlined">
              Thêm dòng
            </Button>
            <Typography color="text.secondary" variant="body2">
              {rows.length}/{field.rows} dòng
            </Typography>
          </Stack>
        )}
      </Box>
    )
  }

  const errorCount = Object.keys(errors).length

  return (
    <form noValidate onSubmit={handleSubmit}>
      <Box aria-live="assertive" ref={errorRef} sx={{ '&:focus': { outline: 'none' } }} tabIndex={-1}>
        {(formError || errorCount > 0) && (
          <Alert data-testid="worksheet-form-error" role="alert" severity="error" sx={{ mb: 3 }}>
            {formError?.message ?? `Còn ${errorCount} ô cần kiểm tra lại.`}
            {formError?.reason === 'unauthenticated' && (
              <Box component="p" sx={{ m: 0, mt: 1 }}>
                <Link color="inherit" href="/login/giaovien" rel="noopener" target="_blank" underline="always">
                  Đăng nhập lại trong thẻ mới
                </Link>{' '}
                — nội dung bạn đã nhập vẫn được giữ ở trang này.
              </Box>
            )}
          </Alert>
        )}
      </Box>

      <Stack spacing={3}>
        {template.sections.map((section) => (
          <Card aria-labelledby={`form-${section.key}`} component="section" key={section.key}>
            <CardContent sx={{ display: 'grid', gap: 3 }}>
              <Box>
                <Typography component="h2" id={`form-${section.key}`} variant="h5">
                  {section.title}
                </Typography>
                {section.description && (
                  <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                    {section.description}
                  </Typography>
                )}
              </Box>

              {(section.accountFields?.length || section.fields.some((field) => field.kind === 'field')) && (
                <Box sx={{ alignItems: 'start', display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}>
                  {section.accountFields?.map((item) => (
                    // Giá trị lấy từ tài khoản, không sửa được: hiển thị kiểu filled text field M3 ở trạng thái chỉ đọc
                    <Box
                      key={item.label}
                      sx={{
                        bgcolor: 'm3.surfaceContainerHighest',
                        borderBottom: 1,
                        borderColor: 'm3.outline',
                        borderRadius: '4px 4px 0 0',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minHeight: 56,
                        px: 2,
                        py: 0.75,
                      }}
                    >
                      <Typography color="text.secondary" component="p" variant="caption">
                        {item.label}
                      </Typography>
                      <Box data-testid="account-field">{teacherName}</Box>
                    </Box>
                  ))}
                  {section.fields.map((field) => (field.kind === 'field' ? renderScalar(field) : null))}
                </Box>
              )}

              {section.fields.map((field) => (field.kind === 'table' ? renderTable(field) : null))}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Thanh hành động dính đáy màn hình: phiếu dài vẫn thấy nút Nộp mà không phải cuộn xuống cuối.
          Màn hình nhỏ: nằm trên navigation bar của khu vực Giáo viên */}
      <Paper
        elevation={3}
        sx={{
          bgcolor: 'm3.surfaceContainer',
          borderRadius: 4,
          bottom: { xs: NAV_BAR_HEIGHT + 12, md: 16 },
          mt: 4,
          p: 1.5,
          position: 'sticky',
          zIndex: 'appBar',
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Button href="/giaovien/phieu" variant="text">
            Quay lại
          </Button>
          <Button
            disabled={isPending}
            size="large"
            startIcon={isPending ? <CircularProgress color="inherit" size={18} /> : <SendRounded />}
            type="submit"
            variant="contained"
          >
            {isPending ? 'Đang nộp…' : 'Nộp phiếu'}
          </Button>
        </Stack>
      </Paper>
    </form>
  )
}
