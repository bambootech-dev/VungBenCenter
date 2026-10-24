'use client'

import { AlertCircle, Loader2, Plus, Send, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useRef, useState, useTransition } from 'react'

import { submitWorksheet, type SubmitWorksheetResult } from '@/actions/submitWorksheet'
import { TableHeader } from '@/components/WorksheetTemplate/TableHeader'
import {
  cardClass,
  errorAlertClass,
  focusRing,
  inputClass,
  labelClass,
  linkClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/ui/brand'
import { cn } from '@/utilities/ui'
import { rowHeader } from '@/worksheetTemplates/snapshot'
import type { ScalarField, TableColumn, TableField, WorksheetTemplate } from '@/worksheetTemplates/types'
import { normalizeTemplateValues } from '@/worksheetTemplates/validate'

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

const cellClass =
  'h-10 w-full min-w-0 rounded-lg border-2 border-lesson-border bg-lesson-surface px-2 text-center text-sm font-semibold text-lesson-primary-dark transition focus:border-lesson-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-lesson-primary/25 aria-invalid:border-red-400 aria-invalid:bg-red-50'
const thClass =
  'border-2 border-lesson-border bg-lesson-primary-soft px-1.5 py-2 text-center text-xs font-extrabold text-lesson-primary-dark sm:text-sm'

const columnWidth = (column: TableColumn) =>
  column.maxLength && column.maxLength > 50 ? 'min-w-56' : column.group ? 'min-w-12' : 'min-w-20'

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

  const errorText = (path: string) =>
    errors[path] ? (
      <p className="mt-1.5 text-sm font-semibold text-red-700" id={`${inputId(path)}-error`}>
        {errors[path]}
      </p>
    ) : null

  const fieldProps = (path: string) => ({
    'aria-describedby': errors[path] ? `${inputId(path)}-error` : undefined,
    'aria-invalid': errors[path] ? true : undefined,
    id: inputId(path),
  })

  const renderScalar = (field: ScalarField) => {
    const path = `values.${field.key}`
    const value = scalars[field.key] ?? ''
    const label = (
      <>
        {field.label}
        {field.required && (
          <>
            <span aria-hidden="true" className="ml-1 text-red-700">
              *
            </span>
            <span className="sr-only"> (bắt buộc)</span>
          </>
        )}
      </>
    )

    if (field.type === 'month') {
      // Tháng + năm tách riêng: input type="month" không có trên Safari
      const [year = '', month = ''] = value.split('-')
      const update = (nextYear: string, nextMonth: string) =>
        setScalar(field.key, nextYear || nextMonth ? `${nextYear}-${nextMonth}` : '')

      return (
        <fieldset aria-describedby={errors[path] ? `${inputId(path)}-error` : undefined} key={field.key}>
          <legend className={labelClass}>{label}</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="sr-only" htmlFor={inputId(path)}>
              Tháng
            </label>
            <select
              aria-invalid={errors[path] ? true : undefined}
              aria-required={field.required}
              className={inputClass}
              id={inputId(path)}
              onChange={(event) => update(year, event.target.value)}
              value={month}
            >
              <option value="">Tháng</option>
              {MONTHS.map((item) => (
                <option key={item} value={item}>
                  Tháng {Number(item)}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor={`${inputId(path)}-year`}>
              Năm
            </label>
            <input
              aria-invalid={errors[path] ? true : undefined}
              aria-required={field.required}
              className={inputClass}
              id={`${inputId(path)}-year`}
              inputMode="numeric"
              maxLength={4}
              onChange={(event) => update(event.target.value.replace(/\D/g, ''), month)}
              placeholder="Năm"
              value={year}
            />
          </div>
          {errorText(path)}
        </fieldset>
      )
    }

    return (
      <div className={field.type === 'textarea' ? 'sm:col-span-2' : undefined} key={field.key}>
        <label className={labelClass} htmlFor={inputId(path)}>
          {label}
        </label>
        {field.type === 'textarea' ? (
          <textarea
            {...fieldProps(path)}
            aria-required={field.required}
            className={cn(inputClass, 'h-auto min-h-32 py-3')}
            maxLength={field.maxLength}
            onChange={(event) => setScalar(field.key, event.target.value)}
            value={value}
          />
        ) : (
          <input
            {...fieldProps(path)}
            aria-required={field.required}
            className={inputClass}
            maxLength={field.maxLength}
            onChange={(event) => setScalar(field.key, event.target.value)}
            type={field.type}
            value={value}
          />
        )}
        {errorText(path)}
      </div>
    )
  }

  const renderTable = (field: TableField) => {
    const rows = tables[field.key]
    const tableErrors = Object.entries(errors).filter(([path]) => path.startsWith(`values.${field.key}`))

    return (
      <div key={field.key}>
        {field.columns.length > 4 && (
          <p className="mb-2 text-sm font-semibold text-lesson-muted sm:hidden">Vuốt ngang để xem hết các cột của bảng.</p>
        )}
        <div className="overflow-x-auto rounded-2xl border-2 border-lesson-border bg-lesson-surface">
          <table className="w-full border-collapse" data-testid={`form-table-${field.key}`}>
            <caption className="sr-only">{field.label}</caption>
            <TableHeader
              cellClassName={thClass}
              columns={field.columns}
              leadingLabel={field.mode === 'fixed' ? rowHeader(field) : '#'}
            />
            <tbody>
              {rows.map((row, rowIndex) => {
                const rowName =
                  field.mode === 'fixed'
                    ? (field.rowLabel ?? '{n}').replace('{n}', String(rowIndex + 1))
                    : `Dòng ${rowIndex + 1}`

                return (
                  <tr key={rowIndex}>
                    <th className={cn(thClass, 'whitespace-nowrap')} scope="row">
                      {field.mode === 'fixed' ? (
                        rowName
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          {rowIndex + 1}
                          {rows.length > 1 && (
                            <button
                              aria-label={`Xoá ${rowName.toLowerCase()}`}
                              className={cn('rounded-md p-1 text-lesson-muted hover:bg-red-50 hover:text-red-700', focusRing)}
                              onClick={() => removeRow(field, rowIndex)}
                              type="button"
                            >
                              <Trash2 aria-hidden="true" className="size-4" />
                            </button>
                          )}
                        </span>
                      )}
                    </th>
                    {field.columns.map((column) => {
                      const path = `values.${field.key}.${rowIndex}.${column.key}`
                      const columnName = column.group ? `${column.group} ${column.label}` : column.label

                      return (
                        <td className={cn('border-2 border-lesson-border p-1', columnWidth(column))} key={column.key}>
                          <input
                            aria-describedby={errors[path] ? `${inputId(path)}-error` : undefined}
                            aria-invalid={errors[path] ? true : undefined}
                            aria-label={`${rowName} – ${columnName}`}
                            className={cn(cellClass, column.maxLength && column.maxLength > 50 && 'text-left')}
                            id={inputId(path)}
                            inputMode={column.type === 'integer' ? 'numeric' : undefined}
                            maxLength={column.type === 'integer' ? 3 : column.maxLength}
                            onChange={(event) => setCell(field.key, rowIndex, column.key, event.target.value)}
                            value={row[column.key] ?? ''}
                          />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {tableErrors.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm font-semibold text-red-700">
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
          </ul>
        )}

        {field.mode === 'dynamic' && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              className={secondaryButtonClass}
              disabled={rows.length >= field.rows}
              onClick={() => addRow(field)}
              type="button"
            >
              <Plus aria-hidden="true" className="size-5" strokeWidth={2.75} />
              Thêm dòng
            </button>
            <p className="text-sm font-semibold text-lesson-muted">
              {rows.length}/{field.rows} dòng
            </p>
          </div>
        )}
      </div>
    )
  }

  const errorCount = Object.keys(errors).length

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div aria-live="assertive" ref={errorRef} tabIndex={-1}>
        {(formError || errorCount > 0) && (
          <div className={cn(errorAlertClass, 'mb-6 flex gap-3')} data-testid="worksheet-form-error" role="alert">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <div>
              <p>{formError?.message ?? `Còn ${errorCount} ô cần kiểm tra lại.`}</p>
              {formError?.reason === 'unauthenticated' && (
                <p className="mt-2">
                  <Link className={linkClass} href="/login/giaovien" rel="noopener" target="_blank">
                    Đăng nhập lại trong thẻ mới
                  </Link>{' '}
                  — nội dung bạn đã nhập vẫn được giữ ở trang này.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {template.sections.map((section) => (
          <section aria-labelledby={`form-${section.key}`} className={cn(cardClass, 'p-5 sm:p-6')} key={section.key}>
            <h2 className="text-xl font-extrabold text-lesson-primary-dark" id={`form-${section.key}`}>
              {section.title}
            </h2>
            {section.description && (
              <p className="mt-1 text-sm font-semibold text-lesson-muted">{section.description}</p>
            )}

            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {section.accountFields?.map((item) => (
                <div key={item.label}>
                  <p className={labelClass}>{item.label}</p>
                  <p
                    className="flex h-12 items-center rounded-2xl border-2 border-dashed border-lesson-border bg-lesson-page px-4 text-base font-bold text-lesson-primary-dark"
                    data-testid="account-field"
                  >
                    {teacherName}
                  </p>
                </div>
              ))}
              {section.fields.map((field) => (field.kind === 'field' ? renderScalar(field) : null))}
            </div>

            {section.fields.map((field) => (field.kind === 'table' ? <div className="mt-2" key={field.key}>{renderTable(field)}</div> : null))}
          </section>
        ))}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className={secondaryButtonClass} href="/giaovien/phieu">
          Quay lại
        </Link>
        <button aria-disabled={isPending} className={primaryButtonClass} disabled={isPending} type="submit">
          {isPending ? (
            <>
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
              Đang nộp…
            </>
          ) : (
            <>
              <Send aria-hidden="true" className="size-5" strokeWidth={2.5} />
              Nộp phiếu
            </>
          )}
        </button>
      </div>
    </form>
  )
}
