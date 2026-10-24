import FamilyRestroomRounded from '@mui/icons-material/FamilyRestroomRounded'
import SchoolRounded from '@mui/icons-material/SchoolRounded'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import React from 'react'

const roles = [
  {
    icon: <SchoolRounded />,
    title: 'Giáo viên',
    description: 'Truy cập khu vực quản lý dành cho Giáo viên.',
    login: { href: '/login/giaovien', label: 'Đăng nhập Giáo viên' },
    register: { href: '/register/giaovien', label: 'Đăng ký Giáo viên' },
    note: 'Tài khoản Giáo viên cần được Admin phê duyệt.',
  },
  {
    // Học sinh / Phụ huynh: dùng chung role hocsinh
    icon: <FamilyRestroomRounded />,
    title: 'Học sinh / Phụ huynh',
    description: 'Truy cập khu vực học tập dành cho Học sinh và Phụ huynh.',
    login: { href: '/login/hocsinh', label: 'Đăng nhập Học sinh / Phụ huynh' },
    register: { href: '/register/hocsinh', label: 'Đăng ký tài khoản người học' },
    note: 'Học sinh / Phụ huynh có thể đăng nhập ngay sau khi đăng ký.',
  },
]

export default function AccountPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <Box sx={{ mb: { xs: 4, md: 6 }, textAlign: 'center' }}>
        <Typography color="primary" component="p" sx={{ mb: 1 }} variant="overline">
          Vững Bền Center
        </Typography>
        <Typography component="h1" sx={{ mb: 1.5 }} variant="h2">
          Chào mừng bạn
        </Typography>
        <Typography variant="subtitle1">Vui lòng chọn vai trò để đăng nhập hoặc tạo tài khoản.</Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
        {roles.map((role) => (
          <Card component="article" key={role.title}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { md: 4 } }}>
              <Avatar aria-hidden="true" sx={{ height: 56, mb: 2.5, width: 56 }}>
                {role.icon}
              </Avatar>
              <Typography component="h2" sx={{ mb: 1 }} variant="h4">
                {role.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {role.description}
              </Typography>

              <Stack spacing={1.5} sx={{ mt: 'auto' }}>
                <Button fullWidth href={role.login.href} size="large" variant="contained">
                  {role.login.label}
                </Button>
                <Button fullWidth href={role.register.href} size="large" variant="tonal">
                  {role.register.label}
                </Button>
              </Stack>

              <Typography color="text.secondary" sx={{ mt: 2 }} variant="caption" component="p">
                {role.note}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Typography color="text.secondary" sx={{ mt: 5, textAlign: 'center' }}>
        Bạn là quản trị viên? <Link href="/admin/login">Đăng nhập Admin</Link>
      </Typography>
    </Container>
  )
}
