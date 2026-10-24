import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import FamilyRestroomRounded from '@mui/icons-material/FamilyRestroomRounded'
import SchoolRounded from '@mui/icons-material/SchoolRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import React from 'react'

const roles = [
  {
    icon: <FamilyRestroomRounded fontSize="inherit" />,
    title: 'Học sinh / Phụ huynh',
    description: 'Đăng ký và đăng nhập ngay để vào khu vực học tập.',
    register: '/register/hocsinh',
    login: '/login/hocsinh',
  },
  {
    icon: <SchoolRounded fontSize="inherit" />,
    title: 'Giáo viên',
    description: 'Đăng ký tài khoản; Quản trị viên sẽ phê duyệt trước khi bạn đăng nhập.',
    register: '/register/giaovien',
    login: '/login/giaovien',
  },
]

// Minh hoạ trang trí cho phần mở đầu: vài thẻ âm với các hình khối kiểu Material 3
const SOUND_TILES = [
  { sound: 'Th', bg: 'primary.main', color: 'primary.contrastText', radius: '50%' },
  { sound: 'Ch', bg: 'm3.tertiaryContainer', color: 'm3.onTertiaryContainer', radius: '28px' },
  { sound: 'Nh', bg: 'm3.secondaryContainer', color: 'm3.onSecondaryContainer', radius: '50% 50% 28px 28px' },
  { sound: 'Ph', bg: 'm3.primaryContainer', color: 'm3.onPrimaryContainer', radius: '28px 4px 28px 4px' },
]

export default function HomePage() {
  return (
    <>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box
          component="section"
          sx={{
            alignItems: 'center',
            display: 'grid',
            gap: { xs: 6, md: 8 },
            gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
          }}
        >
          <Box>
            <Chip color="primary" label="Trung tâm học tập" sx={{ mb: 3 }} variant="outlined" />
            <Typography component="h1" sx={{ mb: 2.5 }} variant="h1">
              Vững Bền Center
            </Typography>
            <Typography sx={{ fontSize: '1.125rem', maxWidth: '52ch', mb: 4 }} variant="subtitle1">
              Nền tảng dành cho Học sinh / Phụ huynh và Giáo viên của trung tâm.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button endIcon={<ArrowForwardRounded />} href="/login" size="large" variant="contained">
                Đăng nhập
              </Button>
              <Button href="/bai-hoc" size="large" variant="outlined">
                Xem bài học
              </Button>
            </Stack>
          </Box>

          <Box
            aria-hidden="true"
            sx={{
              display: { xs: 'none', md: 'grid' },
              gap: 3,
              gridTemplateColumns: 'repeat(2, 1fr)',
              justifySelf: 'center',
              maxWidth: 360,
              width: '100%',
            }}
          >
            {SOUND_TILES.map((tile) => (
              <Box
                key={tile.sound}
                sx={{
                  alignItems: 'center',
                  aspectRatio: '1',
                  bgcolor: tile.bg,
                  borderRadius: tile.radius,
                  color: tile.color,
                  display: 'flex',
                  fontSize: '3.5rem',
                  fontWeight: 500,
                  justifyContent: 'center',
                }}
              >
                {tile.sound}
              </Box>
            ))}
          </Box>
        </Box>
      </Container>

      <Box component="section" aria-labelledby="vai-tro" sx={{ pb: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Typography component="h2" id="vai-tro" sx={{ mb: 3 }} variant="h4">
            Bắt đầu theo vai trò của bạn
          </Typography>
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            {roles.map((role) => (
              <Card component="article" key={role.title}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', p: { md: 4 } }}>
                  <Box
                    aria-hidden="true"
                    sx={{
                      alignItems: 'center',
                      bgcolor: 'm3.primaryContainer',
                      borderRadius: 4,
                      color: 'm3.onPrimaryContainer',
                      display: 'flex',
                      fontSize: 30,
                      height: 56,
                      justifyContent: 'center',
                      width: 56,
                    }}
                  >
                    {role.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography component="h3" sx={{ mb: 1 }} variant="h4">
                      {role.title}
                    </Typography>
                    <Typography color="text.secondary">{role.description}</Typography>
                  </Box>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button href={role.register} variant="contained">
                      Đăng ký {role.title}
                    </Button>
                    <Button href={role.login} variant="tonal">
                      Đăng nhập
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>
    </>
  )
}
