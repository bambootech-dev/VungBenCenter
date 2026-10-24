'use client'

import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined'
import AssignmentRounded from '@mui/icons-material/AssignmentRounded'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import DashboardRounded from '@mui/icons-material/DashboardRounded'
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined'
import FactCheckRounded from '@mui/icons-material/FactCheckRounded'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Box from '@mui/material/Box'
import GlobalStyles from '@mui/material/GlobalStyles'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { usePathname } from 'next/navigation'
import React from 'react'

const items = [
  { href: '/giaovien/dashboard', icon: DashboardOutlined, activeIcon: DashboardRounded, label: 'Tổng quan' },
  { href: '/giaovien/phieu', icon: AssignmentOutlined, activeIcon: AssignmentRounded, label: 'Phiếu' },
  { href: '/giaovien/bai-da-nop', icon: FactCheckOutlined, activeIcon: FactCheckRounded, label: 'Bài đã nộp' },
]

// Chiều cao navigation bar M3 trên màn hình nhỏ
export const NAV_BAR_HEIGHT = 80

const isCurrentPath = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`)

// Màn hình lớn: navigation drawer M3 bên trái, dính khi cuộn; màn hình nhỏ: navigation bar M3 cố định ở đáy
export const TeacherNav = () => {
  const pathname = usePathname()
  const current = items.find((item) => isCurrentPath(pathname, item.href))?.href ?? false

  return (
    <>
      <Box aria-label="Khu vực Giáo viên" component="nav" sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 88 }}>
        <Typography color="text.secondary" component="p" sx={{ px: 2, py: 2 }} variant="subtitle2">
          Khu vực Giáo viên
        </Typography>
        <List disablePadding sx={{ display: 'grid', gap: 0.5 }}>
          {items.map(({ activeIcon, href, icon, label }) => {
            const isCurrent = href === current
            const Icon = isCurrent ? activeIcon : icon

            return (
              <ListItem disablePadding key={href}>
                <ListItemButton aria-current={isCurrent ? 'page' : undefined} href={href} selected={isCurrent}>
                  <ListItemIcon>
                    <Icon aria-hidden="true" />
                  </ListItemIcon>
                  <ListItemText primary={label} />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Box>

      {/* Chừa chỗ cho navigation bar để chân trang không bị che */}
      <GlobalStyles styles={(theme) => ({ [theme.breakpoints.down('md')]: { body: { paddingBottom: `calc(${NAV_BAR_HEIGHT}px + env(safe-area-inset-bottom))` } } })} />
      <Box
        aria-label="Khu vực Giáo viên"
        component="nav"
        sx={{ bottom: 0, display: { md: 'none' }, left: 0, pb: 'env(safe-area-inset-bottom)', position: 'fixed', right: 0, zIndex: 'appBar', bgcolor: 'm3.surfaceContainer' }}
      >
        <BottomNavigation component="div" showLabels value={current}>
          {items.map(({ activeIcon, href, icon, label }) => {
            const isCurrent = href === current
            const Icon = isCurrent ? activeIcon : icon

            return (
              <BottomNavigationAction
                aria-current={isCurrent ? 'page' : undefined}
                href={href}
                icon={
                  // Chỉ báo hình viên thuốc phía sau biểu tượng của mục đang mở
                  <Box
                    component="span"
                    sx={{
                      alignItems: 'center',
                      bgcolor: isCurrent ? 'm3.secondaryContainer' : 'transparent',
                      borderRadius: 999,
                      color: isCurrent ? 'm3.onSecondaryContainer' : 'inherit',
                      display: 'flex',
                      height: 32,
                      justifyContent: 'center',
                      transition: 'background-color 200ms',
                      width: 64,
                    }}
                  >
                    <Icon aria-hidden="true" />
                  </Box>
                }
                key={href}
                label={label}
                value={href}
              />
            )
          })}
        </BottomNavigation>
      </Box>
    </>
  )
}
