'use client'

import AutoStoriesOutlined from '@mui/icons-material/AutoStoriesOutlined'
import AutoStoriesRounded from '@mui/icons-material/AutoStoriesRounded'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import HomeRounded from '@mui/icons-material/HomeRounded'
import MenuRounded from '@mui/icons-material/MenuRounded'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import useScrollTrigger from '@mui/material/useScrollTrigger'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'

import { Logo } from '@/components/Logo/Logo'

const NAV_ITEMS = [
  { href: '/', icon: HomeOutlined, activeIcon: HomeRounded, label: 'Trang chủ' },
  { href: '/bai-hoc', icon: AutoStoriesOutlined, activeIcon: AutoStoriesRounded, label: 'Bài học' },
]

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

export const SiteHeader = () => {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  // Top app bar M3: đổi sang màu surface-container khi trang đã cuộn
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 0 })

  return (
    <AppBar position="sticky" sx={{ bgcolor: scrolled ? 'm3.surfaceContainer' : undefined }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: { xs: 1, sm: 2 }, minHeight: { xs: 64 } }}>
          <IconButton
            aria-controls={open ? 'menu-di-dong' : undefined}
            aria-expanded={open}
            aria-label="Mở menu"
            edge="start"
            onClick={() => setOpen(true)}
            sx={{ color: 'text.primary', display: { sm: 'none' } }}
          >
            <MenuRounded />
          </IconButton>

          <Link aria-label="Vững Bền Center — Trang chủ" href="/" sx={{ display: 'inline-flex' }} underline="none">
            <Logo />
          </Link>

          <Box sx={{ flex: 1 }} />

          <Box aria-label="Điều hướng chính" component="nav" sx={{ alignItems: 'center', display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href)

              return (
                <Button
                  aria-current={active ? 'page' : undefined}
                  href={item.href}
                  key={item.href}
                  sx={{
                    color: active ? 'm3.onSecondaryContainer' : 'text.secondary',
                    bgcolor: active ? 'm3.secondaryContainer' : undefined,
                    px: 2,
                  }}
                  variant="text"
                >
                  {item.label}
                </Button>
              )
            })}
            <Button href="/login" sx={{ ml: 1 }} variant="contained">
              Đăng nhập
            </Button>
          </Box>
        </Toolbar>
      </Container>

      {/* Modal navigation drawer M3 */}
      <Drawer anchor="left" id="menu-di-dong" onClose={() => setOpen(false)} open={open} slotProps={{ paper: { sx: { maxWidth: '85vw', width: 320 } } }}>
        <Box sx={{ px: 3, py: 2.5 }}>
          <Logo />
        </Box>
        <Divider sx={{ mx: 2 }} />
        <Box aria-label="Điều hướng chính" component="nav" sx={{ p: 1.5 }}>
          <List disablePadding sx={{ display: 'grid', gap: 0.5 }}>
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href)
              const Icon = active ? item.activeIcon : item.icon

              return (
                <ListItemButton
                  aria-current={active ? 'page' : undefined}
                  href={item.href}
                  key={item.href}
                  onClick={() => setOpen(false)}
                  selected={active}
                >
                  <ListItemIcon>
                    <Icon aria-hidden="true" />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              )
            })}
          </List>
          <Button fullWidth href="/login" onClick={() => setOpen(false)} size="large" sx={{ mt: 2 }} variant="contained">
            Đăng nhập
          </Button>
        </Box>
      </Drawer>
    </AppBar>
  )
}
