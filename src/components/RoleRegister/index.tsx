'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'

import { registerAccount } from '@/actions/registerAccount'
import { AuthCard } from '@/components/AuthCard'

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
    <AuthCard onSubmit={handleSubmit} title={title}>
      <div className="form-floating mb-3">
        <input
          autoComplete="name"
          className="form-control"
          disabled={loading}
          id={`${role}-name`}
          name="name"
          placeholder="Họ và tên"
          required
          type="text"
        />
        <label htmlFor={`${role}-name`}>Họ và tên</label>
      </div>

      <div className="form-floating mb-3">
        <input
          autoComplete="email"
          className="form-control"
          disabled={loading}
          id={`${role}-email`}
          name="email"
          placeholder="Email"
          required
          type="email"
        />
        <label htmlFor={`${role}-email`}>Email</label>
      </div>

      <div className="form-floating mb-3">
        <input
          autoComplete="new-password"
          className="form-control"
          disabled={loading}
          id={`${role}-password`}
          minLength={8}
          name="password"
          placeholder="Mật khẩu"
          required
          type="password"
        />
        <label htmlFor={`${role}-password`}>Mật khẩu</label>
      </div>

      <div className="form-floating mb-3">
        <input
          autoComplete="new-password"
          className="form-control"
          disabled={loading}
          id={`${role}-confirm-password`}
          minLength={8}
          name="confirmPassword"
          placeholder="Nhập lại mật khẩu"
          required
          type="password"
        />
        <label htmlFor={`${role}-confirm-password`}>Nhập lại mật khẩu</label>
      </div>

      {error && (
        <div className="alert alert-danger d-flex gap-2" role="alert">
          <i aria-hidden="true" className="bi bi-exclamation-circle-fill" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="alert alert-success d-flex gap-2" role="status">
          <i aria-hidden="true" className="bi bi-check-circle-fill" />
          <span>{message}</span>
        </div>
      )}

      <button className="btn btn-primary btn-lg w-100 mt-2" disabled={loading} type="submit">
        {loading && <span aria-hidden="true" className="spinner-border spinner-border-sm me-2" />}
        {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
      </button>

      <p className="text-center text-body-secondary mt-4 mb-0">
        Đã có tài khoản? <Link className="fw-bold" href={loginTo}>Đăng nhập</Link>
      </p>
    </AuthCard>
  )
}
