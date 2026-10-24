'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

import {
  cardClass,
  errorAlertClass,
  inputClass,
  labelClass,
  pageTitleClass,
  pillClass,
  primaryButtonClass,
} from '@/components/ui/brand'

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
    <main className="flex flex-1 items-center justify-center px-4 py-12 md:py-20">
      <form className={`${cardClass} w-full max-w-md p-6 sm:p-8`} onSubmit={handleSubmit}>
        <p className={`${pillClass} mb-3`}>Vững Bền Center</p>
        <h1 className={`${pageTitleClass} mb-6`}>{title}</h1>

        <div className="space-y-5">
          <div>
            <label className={labelClass} htmlFor={`${role}-login-email`}>
              Email
            </label>
            <input
              autoComplete="email"
              className={inputClass}
              id={`${role}-login-email`}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor={`${role}-login-password`}>
              Mật khẩu
            </label>
            <input
              autoComplete="current-password"
              className={inputClass}
              id={`${role}-login-password`}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {error && (
            <p className={errorAlertClass} role="alert">
              {error}
            </p>
          )}

          <button className={`${primaryButtonClass} w-full`} disabled={loading} type="submit">
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </div>
      </form>
    </main>
  )
}
