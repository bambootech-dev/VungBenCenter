'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useRef, useState, useTransition } from 'react'

import { submitWorksheet, type SubmitWorksheetResult } from '@/actions/submitWorksheet'
import { TableHeader } from '@/components/WorksheetTemplate/TableHeader'
import { useUnsavedChanges } from '@/utilities/unsavedChanges'
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

const thClass = 'bg-primary-subtle text-primary-emphasis text-center small'

// Độ rộng tối thiểu của cột (styles/_custom.scss): ô ghi chú dài rộng, ô số trong nhóm hẹp
const columnWidth = (column: TableColumn) =>
  column.maxLength && column.maxLength > 50 ? 'cell-w-lg' : column.group ? 'cell-w-xs' : 'cell-w-sm'

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

  // Đã nhập gì đó: hỏi lại trước khi đóng/tải lại thẻ và không để Header tự chuyển trang khi phiên hết hạn
  const isDirty =
    Object.values(scalars).some(Boolean) ||
    Object.values(tables).some((rows) => rows.some((row) => Object.values(row).some(Boolean)))
  useUnsavedChanges(isDirty)

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
      <p className="invalid-feedback d-block" id={`${inputId(path)}-error`}>
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
            <span aria-hidden="true" className="ms-1 text-danger">
              *
            </span>
            <span className="visually-hidden"> (bắt buộc)</span>
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
          <legend className="form-label fs-6">{label}</legend>
          <div className="row g-2">
            <label className="visually-hidden" htmlFor={inputId(path)}>
              Tháng
            </label>
            <div className="col-6">
            <select
              aria-invalid={errors[path] ? true : undefined}
              aria-required={field.required}
              className={clsx('form-select', errors[path] && 'is-invalid')}
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
            </div>
            <label className="visually-hidden" htmlFor={`${inputId(path)}-year`}>
              Năm
            </label>
            <div className="col-6">
            <input
              aria-invalid={errors[path] ? true : undefined}
              aria-required={field.required}
              className={clsx('form-control', errors[path] && 'is-invalid')}
              id={`${inputId(path)}-year`}
              inputMode="numeric"
              maxLength={4}
              onChange={(event) => update(event.target.value.replace(/\D/g, ''), month)}
              placeholder="Năm"
              value={year}
            />
            </div>
          </div>
          {errorText(path)}
        </fieldset>
      )
    }

    return (
      <div className={field.type === 'textarea' ? 'col-12' : 'col-12 col-sm-6'} key={field.key}>
        <label className="form-label" htmlFor={inputId(path)}>
          {label}
        </label>
        {field.type === 'textarea' ? (
          <textarea
            {...fieldProps(path)}
            aria-required={field.required}
            className={clsx('form-control', errors[path] && 'is-invalid')}
            maxLength={field.maxLength}
            onChange={(event) => setScalar(field.key, event.target.value)}
            rows={4}
            value={value}
          />
        ) : (
          <input
            {...fieldProps(path)}
            aria-required={field.required}
            className={clsx('form-control', errors[path] && 'is-invalid')}
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
          <p className="small text-body-secondary d-sm-none mb-2">Vuốt ngang để xem hết các cột của bảng.</p>
        )}
        <div className="table-responsive border rounded">
          <table className="table table-bordered table-sm align-middle mb-0" data-testid={`form-table-${field.key}`}>
            <caption className="visually-hidden">{field.label}</caption>
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
                    <th className={clsx(thClass, 'text-nowrap')} scope="row">
                      {field.mode === 'fixed' ? (
                        rowName
                      ) : (
                        <span className="d-flex align-items-center justify-content-center gap-1">
                          {rowIndex + 1}
                          {rows.length > 1 && (
                            <button
                              aria-label={`Xoá ${rowName.toLowerCase()}`}
                              className="btn btn-sm btn-outline-danger border-0 px-2 py-1"
                              onClick={() => removeRow(field, rowIndex)}
                              type="button"
                            >
                              <i aria-hidden="true" className="bi bi-trash3" />
                            </button>
                          )}
                        </span>
                      )}
                    </th>
                    {field.columns.map((column) => {
                      const path = `values.${field.key}.${rowIndex}.${column.key}`
                      const columnName = column.group ? `${column.group} ${column.label}` : column.label

                      return (
                        <td className={clsx('p-1', columnWidth(column))} key={column.key}>
                          <input
                            aria-describedby={errors[path] ? `${inputId(path)}-error` : undefined}
                            aria-invalid={errors[path] ? true : undefined}
                            aria-label={`${rowName} – ${columnName}`}
                            className={clsx(
                              'form-control form-control-sm',
                              !(column.maxLength && column.maxLength > 50) && 'text-center',
                              errors[path] && 'is-invalid',
                            )}
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
          <ul className="list-unstyled small fw-semibold text-danger d-grid gap-1 mt-2 mb-0">
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
          <div className="d-flex flex-wrap align-items-center gap-3 mt-3">
            <button
              className="btn btn-outline-primary"
              disabled={rows.length >= field.rows}
              onClick={() => addRow(field)}
              type="button"
            >
              <i aria-hidden="true" className="bi bi-plus-lg me-1" />
              Thêm dòng
            </button>
            <p className="small text-body-secondary mb-0">
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
          <div className="alert alert-danger d-flex gap-2 mb-4" data-testid="worksheet-form-error" role="alert">
            <i aria-hidden="true" className="bi bi-exclamation-circle-fill" />
            <div>
              <p className="mb-0">{formError?.message ?? `Còn ${errorCount} ô cần kiểm tra lại.`}</p>
              {formError?.reason === 'unauthenticated' && (
                <p className="mt-2 mb-0">
                  <Link className="alert-link" href="/login/giaovien" rel="noopener" target="_blank">
                    Đăng nhập lại trong thẻ mới
                  </Link>{' '}
                  — nội dung bạn đã nhập vẫn được giữ ở trang này.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="d-grid gap-4">
        {template.sections.map((section) => (
          <section aria-labelledby={`form-${section.key}`} className="card shadow-sm" key={section.key}>
            <div className="card-body p-4">
              <h2 className="h4 mb-1" id={`form-${section.key}`}>
                {section.title}
              </h2>
              {section.description && <p className="small text-body-secondary mb-0">{section.description}</p>}

              <div className="row g-3 mt-1">
                {section.accountFields?.map((item) => (
                  <div className="col-12 col-sm-6" key={item.label}>
                    <p className="form-label">{item.label}</p>
                    <p className="form-control-plaintext fw-bold border rounded bg-body-tertiary px-3" data-testid="account-field">
                      {teacherName}
                    </p>
                  </div>
                ))}
                {section.fields.map((field) => (field.kind === 'field' ? renderScalar(field) : null))}
              </div>

              {section.fields.map((field) =>
                field.kind === 'table' ? (
                  <div className="mt-3" key={field.key}>
                    {renderTable(field)}
                  </div>
                ) : null,
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="d-flex flex-column-reverse flex-sm-row align-items-sm-center justify-content-sm-between gap-3 mt-5">
        <Link className="btn btn-outline-primary btn-lg" href="/giaovien/phieu">
          Quay lại
        </Link>
        <button aria-disabled={isPending} className="btn btn-primary btn-lg" disabled={isPending} type="submit">
          {isPending ? (
            <>
              <span aria-hidden="true" className="spinner-border spinner-border-sm me-2" />
              Đang nộp…
            </>
          ) : (
            <>
              <i aria-hidden="true" className="bi bi-send-fill me-2" />
              Nộp phiếu
            </>
          )}
        </button>
      </div>
    </form>
  )
}
