'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

import { AuthCard } from '@/components/AuthCard'

type LoginRole = 'giaovien' | 'hocsinh'

type RoleLoginProps = {
  role: LoginRole
  title: string
  redirectTo: string
}

export function RoleLogin({
  role,
  title,
  redirectTo,
}: RoleLoginProps) {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',

        // Cho phép trình duyệt lưu cookie đăng nhập của Payload
        credentials: 'include',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.errors?.[0]?.message ||
            'Email hoặc mật khẩu không chính xác',
        )
      }

      if (data.user?.role !== role) {
        // Đăng nhập đúng tài khoản nhưng sai cổng role
        await fetch('/api/users/logout', {
          method: 'POST',
          credentials: 'include',
        })

        throw new Error(
          role === 'giaovien'
            ? 'Tài khoản này không phải tài khoản Giáo viên'
            : 'Tài khoản này không phải tài khoản Học sinh / Phụ huynh',
        )
      }

      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Đã xảy ra lỗi khi đăng nhập',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard onSubmit={handleSubmit} title={title}>
      <div className="form-floating mb-3">
        <input
          autoComplete="email"
          className="form-control"
          id={`${role}-login-email`}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ten@email.com"
          required
          type="email"
          value={email}
        />
        <label htmlFor={`${role}-login-email`}>Email</label>
      </div>

      <div className="form-floating mb-4">
        <input
          autoComplete="current-password"
          className="form-control"
          id={`${role}-login-password`}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mật khẩu"
          required
          type="password"
          value={password}
        />
        <label htmlFor={`${role}-login-password`}>Mật khẩu</label>
      </div>

      {error && (
        <div className="alert alert-danger d-flex gap-2" role="alert">
          <i aria-hidden="true" className="bi bi-exclamation-circle-fill" />
          <span>{error}</span>
        </div>
      )}

      <button className="btn btn-primary btn-lg w-100" disabled={loading} type="submit">
        {loading && <span aria-hidden="true" className="spinner-border spinner-border-sm me-2" />}
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </AuthCard>
  )
}
