'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

import LoginRounded from '@mui/icons-material/LoginRounded'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

import { AuthCard } from '@/components/AuthCard'
import { PasswordField } from '@/components/PasswordField'

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
    <AuthCard description="Nhập email và mật khẩu của bạn để tiếp tục." icon={<LoginRounded />} title={title}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
        <TextField
          autoComplete="email"
          fullWidth
          id={`${role}-login-email`}
          label="Email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />

        <PasswordField
          autoComplete="current-password"
          fullWidth
          id={`${role}-login-password`}
          label="Mật khẩu"
          onChange={(event) => setPassword(event.target.value)}
          required
          value={password}
        />

        {error && (
          <Alert role="alert" severity="error">
            {error}
          </Alert>
        )}

        <Button
          disabled={loading}
          fullWidth
          size="large"
          startIcon={loading ? <CircularProgress color="inherit" size={18} /> : undefined}
          type="submit"
          variant="contained"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
        </Stack>
      </form>
    </AuthCard>
  )
}
