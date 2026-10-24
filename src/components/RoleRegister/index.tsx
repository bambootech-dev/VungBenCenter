'use client'

import { FormEvent, useState } from 'react'

import { registerAccount } from '@/actions/registerAccount'
import PersonAddAlt1Rounded from '@mui/icons-material/PersonAddAlt1Rounded'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { AuthCard } from '@/components/AuthCard'
import { PasswordField } from '@/components/PasswordField'

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
    <AuthCard
      description={role === 'giaovien' ? 'Tài khoản Giáo viên cần được Admin phê duyệt trước khi đăng nhập.' : undefined}
      icon={<PersonAddAlt1Rounded />}
      title={title}
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
        <TextField
          autoComplete="name"
          disabled={loading}
          fullWidth
          id={`${role}-name`}
          label="Họ và tên"
          name="name"
          required
        />

        <TextField
          autoComplete="email"
          disabled={loading}
          fullWidth
          id={`${role}-email`}
          label="Email"
          name="email"
          required
          type="email"
        />

        <PasswordField
          autoComplete="new-password"
          disabled={loading}
          fullWidth
          helperText="Tối thiểu 8 ký tự."
          id={`${role}-password`}
          label="Mật khẩu"
          name="password"
          required
          slotProps={{ htmlInput: { minLength: 8 } }}
        />

        <PasswordField
          autoComplete="new-password"
          disabled={loading}
          fullWidth
          id={`${role}-confirm-password`}
          label="Nhập lại mật khẩu"
          name="confirmPassword"
          required
          slotProps={{ htmlInput: { minLength: 8 } }}
        />

        {error && (
          <Alert role="alert" severity="error">
            {error}
          </Alert>
        )}

        {message && (
          <Alert role="status" severity="success">
            {message}
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
          {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </Button>

        <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
          Đã có tài khoản? <Link href={loginTo}>Đăng nhập</Link>
        </Typography>
        </Stack>
      </form>
    </AuthCard>
  )
}
