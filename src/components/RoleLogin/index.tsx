'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

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
            : 'Tài khoản này không phải tài khoản Học sinh',
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
    <main
      style={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxWidth: '420px',
          width: '100%',
        }}
      >
        <h1>{title}</h1>

        <label>
          Email
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
            style={{
              display: 'block',
              marginTop: '8px',
              padding: '12px',
              width: '100%',
            }}
          />
        </label>

        <label>
          Mật khẩu
          <input
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
            style={{
              display: 'block',
              marginTop: '8px',
              padding: '12px',
              width: '100%',
            }}
          />
        </label>

        {error && (
          <p style={{ color: 'red' }}>
            {error}
          </p>
        )}

        <button
          disabled={loading}
          type="submit"
          style={{
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '12px',
          }}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </main>
  )
}