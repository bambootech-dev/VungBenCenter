'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'

import { registerAccount } from '@/actions/registerAccount'
import {
  cardClass,
  errorAlertClass,
  inputClass,
  labelClass,
  linkClass,
  pageTitleClass,
  pillClass,
  primaryButtonClass,
  successAlertClass,
} from '@/components/ui/brand'

type Props = {
  role: 'giaovien' | 'hocsinh'
  title: string
  loginTo: string
}

export function RoleRegister({
  role,
  title,
  loginTo,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    // Lưu form trước khi thực hiện await
    const form = event.currentTarget
    const formData = new FormData(form)

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const result = await registerAccount({
        name: String(formData.get('name') || ''),
        email: String(formData.get('email') || ''),
        password: String(formData.get('password') || ''),
        confirmPassword: String(
          formData.get('confirmPassword') || '',
        ),
        role,
      })

      if (!result.success) {
        setError(result.error || 'Đăng ký thất bại.')
        return
      }

      setMessage(result.message || 'Đăng ký thành công.')

      // Xóa nội dung form sau khi đăng ký thành công
      form.reset()
    } catch {
      setError(
        'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 md:py-20">
      <form className={`${cardClass} w-full max-w-md p-6 sm:p-8`} onSubmit={handleSubmit}>
        <p className={`${pillClass} mb-3`}>Vững Bền Center</p>
        <h1 className={`${pageTitleClass} mb-6`}>{title}</h1>

        <div className="space-y-5">
          <div>
            <label className={labelClass} htmlFor={`${role}-name`}>
              Họ và tên
            </label>
            <input
              autoComplete="name"
              className={inputClass}
              disabled={loading}
              id={`${role}-name`}
              name="name"
              required
              type="text"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor={`${role}-email`}>
              Email
            </label>
            <input
              autoComplete="email"
              className={inputClass}
              disabled={loading}
              id={`${role}-email`}
              name="email"
              required
              type="email"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor={`${role}-password`}>
              Mật khẩu
            </label>
            <input
              autoComplete="new-password"
              className={inputClass}
              disabled={loading}
              id={`${role}-password`}
              minLength={8}
              name="password"
              required
              type="password"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor={`${role}-confirm-password`}>
              Nhập lại mật khẩu
            </label>
            <input
              autoComplete="new-password"
              className={inputClass}
              disabled={loading}
              id={`${role}-confirm-password`}
              minLength={8}
              name="confirmPassword"
              required
              type="password"
            />
          </div>

          {error && (
            <p className={errorAlertClass} role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className={successAlertClass} role="status">
              {message}
            </p>
          )}

          <button className={`${primaryButtonClass} w-full`} disabled={loading} type="submit">
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>

          <p className="text-center font-semibold text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link className={linkClass} href={loginTo}>
              Đăng nhập
            </Link>
          </p>
        </div>
      </form>
    </main>
  )
}
