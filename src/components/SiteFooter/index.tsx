import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import React from 'react'

import { Logo } from '@/components/Logo/Logo'

const LINKS = [
  { href: '/login', label: 'Đăng nhập' },
  { href: '/register/hocsinh', label: 'Đăng ký tài khoản người học' },
  { href: '/register/giaovien', label: 'Đăng ký Giáo viên' },
]

export const SiteFooter = () => (
  <Box component="footer" sx={{ bgcolor: 'm3.surfaceContainer', mt: 'auto' }}>
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 3, md: 4 }}
        sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack spacing={1}>
          <Logo />
          <Typography color="text.secondary" variant="body2">
            Học vững vàng, tiến bộ bền lâu.
          </Typography>
        </Stack>

        <Stack aria-label="Liên kết cuối trang" component="nav" direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }}>
          {LINKS.map((link) => (
            <Link color="text.secondary" href={link.href} key={link.href} variant="body2">
              {link.label}
            </Link>
          ))}
        </Stack>
      </Stack>

      <Typography color="text.secondary" sx={{ borderTop: 1, borderColor: 'divider', mt: 3, pt: 3 }} variant="caption" component="p">
        © {new Date().getFullYear()} Vững Bền Center
      </Typography>
    </Container>
  </Box>
)
