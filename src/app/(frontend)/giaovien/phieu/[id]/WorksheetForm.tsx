'use client'

import { AlertCircle, Loader2, Send } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useId, useRef, useState, useTransition } from 'react'

import { submitWorksheet, type SubmitWorksheetResult } from '@/actions/submitWorksheet'
import { ANSWER_MAX_LENGTH } from '@/collections/WorksheetSubmissions/answers'
import { cn } from '@/utilities/ui'

import { cardClass, focusRing, primaryButtonClass, secondaryButtonClass } from '../../_components/teacherUi'

type Question = {
  key: string
  label: string
  required: boolean
}

type Props = {
  questions: Question[]
  worksheetId: number
}

type FormError = Extract<SubmitWorksheetResult, { ok: false }>

// Giống server: bỏ khoảng trắng đầu/cuối, chuỗi chỉ có khoảng trắng là trống
const clean = (value: string) => value.normalize('NFC').trim()

const validate = (questions: Question[], values: Record<string, string>) => {
  const errors: Record<string, string> = {}

  for (const question of questions) {
    const value = clean(values[question.key] ?? '')

    if (question.required && value === '') {
      errors[question.key] = 'Vui lòng trả lời câu này.'
    } else if (value.length > ANSWER_MAX_LENGTH) {
      errors[question.key] = `Câu trả lời tối đa ${ANSWER_MAX_LENGTH} ký tự.`
    }
  }

  return errors
}

export const WorksheetForm = ({ questions, worksheetId }: Props) => {
  const router = useRouter()
  const formId = useId()
  // Câu trả lời gắn theo mã câu hỏi, không theo vị trí
  const [values, setValues] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<FormError | null>(null)
  const [isPending, startTransition] = useTransition()
  // Chặn bấm liên tiếp trước khi React kịp render trạng thái đang gửi
  const submitting = useRef(false)
  const errorRef = useRef<HTMLDivElement>(null)

  const fieldId = (key: string) => `${formId}-${key}`

  const focusFirstError = (errors: Record<string, string>) => {
    const first = questions.find((question) => errors[question.key])

    if (first) {
      document.getElementById(fieldId(first.key))?.focus()
    } else {
      errorRef.current?.focus()
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (submitting.current) return

    const errors = validate(questions, values)
    setFieldErrors(errors)
    setFormError(null)

    if (Object.keys(errors).length > 0) {
      focusFirstError(errors)
      return
    }

    submitting.current = true

    startTransition(async () => {
      let result: SubmitWorksheetResult

      try {
        result = await submitWorksheet({
          worksheetId,
          answers: questions.map((question) => ({
            questionKey: question.key,
            value: values[question.key] ?? '',
          })),
        })
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
      setFieldErrors(result.fieldErrors ?? {})
      setFormError(result)
      requestAnimationFrame(() => focusFirstError(result.fieldErrors ?? {}))
    })
  }

  const errorCount = Object.keys(fieldErrors).length

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div aria-live="assertive" ref={errorRef} tabIndex={-1}>
        {(formError || errorCount > 0) && (
          <div
            className="mb-6 flex gap-3 rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-base font-semibold text-red-900"
            data-testid="worksheet-form-error"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <div>
              <p>{formError?.message ?? `Còn ${errorCount} câu cần kiểm tra lại.`}</p>
              {formError?.reason === 'unauthenticated' && (
                <p className="mt-2">
                  <Link
                    className={cn('font-extrabold underline', focusRing)}
                    href="/login/giaovien"
                    rel="noopener"
                    target="_blank"
                  >
                    Đăng nhập lại trong thẻ mới
                  </Link>{' '}
                  — nội dung bạn đã nhập vẫn được giữ ở trang này.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <ol className="space-y-5">
        {questions.map((question, index) => {
          const id = fieldId(question.key)
          const error = fieldErrors[question.key]
          const value = values[question.key] ?? ''

          return (
            <li className={cn(cardClass, 'p-5 sm:p-6')} key={question.key}>
              <label className="mb-3 block text-lg font-extrabold text-lesson-primary-dark" htmlFor={id}>
                <span className="mr-2 text-lesson-primary">{index + 1}.</span>
                {question.label}
                {question.required ? (
                  <>
                    <span aria-hidden="true" className="ml-1 text-red-700">
                      *
                    </span>
                    <span className="sr-only"> (bắt buộc)</span>
                  </>
                ) : (
                  <span className="ml-2 text-sm font-bold text-lesson-muted">(không bắt buộc)</span>
                )}
              </label>
              <textarea
                aria-describedby={error ? `${id}-error` : `${id}-count`}
                aria-invalid={error ? true : undefined}
                aria-required={question.required}
                className={cn(
                  'block min-h-32 w-full resize-y rounded-2xl border-2 bg-lesson-surface p-4 text-base font-semibold text-lesson-primary-dark transition placeholder:text-lesson-muted/70 focus:outline-none focus-visible:ring-4',
                  error
                    ? 'border-red-400 focus-visible:ring-red-200'
                    : 'border-lesson-border focus:border-lesson-primary focus-visible:ring-lesson-primary/25',
                )}
                data-question-key={question.key}
                id={id}
                maxLength={ANSWER_MAX_LENGTH}
                name={question.key}
                onChange={(event) => {
                  const next = event.target.value
                  setValues((current) => ({ ...current, [question.key]: next }))

                  if (fieldErrors[question.key]) {
                    setFieldErrors(({ [question.key]: _removed, ...rest }) => rest)
                  }
                }}
                placeholder="Nhập câu trả lời…"
                value={value}
              />
              <div className="mt-2 flex items-start justify-between gap-3 text-sm font-semibold">
                {error ? (
                  <p className="text-red-700" id={`${id}-error`}>
                    {error}
                  </p>
                ) : (
                  <span />
                )}
                <p className="shrink-0 text-lesson-muted" id={`${id}-count`}>
                  {value.length}/{ANSWER_MAX_LENGTH}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className={secondaryButtonClass} href="/giaovien/phieu">
          Quay lại danh sách
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
