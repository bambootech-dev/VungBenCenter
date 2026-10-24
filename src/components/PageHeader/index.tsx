import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import React from 'react'

type Props = {
  actions?: React.ReactNode
  back?: { href: string; label: string }
  children?: React.ReactNode
  description?: React.ReactNode
  eyebrow?: string
  title: React.ReactNode
  titleTestId?: string
}

/** Đầu trang dùng chung: liên kết quay lại, nhãn nhỏ, tiêu đề h1, mô tả và nút hành động. */
export const PageHeader = ({ actions, back, children, description, eyebrow, title, titleTestId }: Props) => (
  <Box component="header" sx={{ mb: { xs: 3, md: 4 } }}>
    {back && (
      <Button
        href={back.href}
        size="small"
        startIcon={<ArrowBackRounded />}
        sx={{ color: 'text.secondary', ml: -1.5, mb: 2 }}
        variant="text"
      >
        {back.label}
      </Button>
    )}

    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between' }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow && (
          <Typography color="primary" component="p" sx={{ mb: 1 }} variant="overline">
            {eyebrow}
          </Typography>
        )}
        <Typography component="h1" data-testid={titleTestId} variant="h2">
          {title}
        </Typography>
        {description && (
          <Typography component="div" sx={{ maxWidth: '62ch', mt: 1 }} variant="subtitle1">
            {description}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
    </Stack>

    {children}
  </Box>
)
