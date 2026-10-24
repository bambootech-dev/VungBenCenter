import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Typography from '@mui/material/Typography'
import React from 'react'

type Props = {
  description: string
  href: string
  icon: React.ReactNode
  title: string
}

/** Thẻ lối tắt: cả thẻ là một liên kết, tên liên kết là tiêu đề + mô tả. */
export const QuickLinkCard = ({ description, href, icon, title }: Props) => (
  <Card sx={{ height: '100%', '&:hover': { boxShadow: 2 } }}>
    <CardActionArea href={href} sx={{ alignItems: 'flex-start', display: 'flex', gap: 2, height: '100%', p: 3 }}>
      <Box
        aria-hidden="true"
        sx={{
          alignItems: 'center',
          bgcolor: 'm3.primaryContainer',
          borderRadius: 4,
          color: 'm3.onPrimaryContainer',
          display: 'flex',
          flexShrink: 0,
          fontSize: 28,
          height: 56,
          justifyContent: 'center',
          width: 56,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="h2" variant="h5">
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
          {description}
        </Typography>
      </Box>
      <ArrowForwardRounded aria-hidden="true" sx={{ alignSelf: 'center', color: 'text.secondary' }} />
    </CardActionArea>
  </Card>
)
