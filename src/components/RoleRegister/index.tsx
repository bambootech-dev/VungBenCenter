'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'

import { registerAccount } from '@/actions/registerAccount'

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
    <main>
      <form onSubmit={handleSubmit}>
        <h1>{title}</h1>

        <div>
          <label htmlFor={`${role}-name`}>
            Họ và tên
          </label>

          <input
            autoComplete="name"
            disabled={loading}
            id={`${role}-name`}
            name="name"
            required
            type="text"
          />
        </div>

        <div>
          <label htmlFor={`${role}-email`}>
            Email
          </label>

          <input
            autoComplete="email"
            disabled={loading}
            id={`${role}-email`}
            name="email"
            required
            type="email"
          />
        </div>

        <div>
          <label htmlFor={`${role}-password`}>
            Mật khẩu
          </label>

          <input
            autoComplete="new-password"
            disabled={loading}
            id={`${role}-password`}
            minLength={8}
            name="password"
            required
            type="password"
          />
        </div>

        <div>
          <label htmlFor={`${role}-confirm-password`}>
            Nhập lại mật khẩu
          </label>

          <input
            autoComplete="new-password"
            disabled={loading}
            id={`${role}-confirm-password`}
            minLength={8}
            name="confirmPassword"
            required
            type="password"
          />
        </div>

        {error && (
          <p role="alert" style={{ color: 'red' }}>
            {error}
          </p>
        )}

        {message && (
          <p role="status" style={{ color: 'green' }}>
            {message}
          </p>
        )}

        <button disabled={loading} type="submit">
          {loading
            ? 'Đang tạo tài khoản...'
            : 'Đăng ký'}
        </button>

        <p>
          Đã có tài khoản?{' '}
          <Link href={loginTo}>Đăng nhập</Link>
        </p>
      </form>
    </main>
  )
}