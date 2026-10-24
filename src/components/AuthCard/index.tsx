import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import React from 'react'

type Props = {
  children: React.ReactNode
  description?: string
  icon: React.ReactNode
  title: string
}

/** Khung chung cho các form đăng nhập / đăng ký: card hẹp ở giữa trang. */
export const AuthCard = ({ children, description, icon, title }: Props) => (
  <Container maxWidth="xs" sx={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', py: { xs: 6, md: 10 } }}>
    <Card sx={{ bgcolor: 'm3.surfaceContainerLowest', borderRadius: 7 }}>
      <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Avatar sx={{ height: 56, mb: 2, mx: 'auto', width: 56 }}>{icon}</Avatar>
          <Typography color="primary" component="p" variant="overline">
            Vững Bền Center
          </Typography>
          <Typography component="h1" sx={{ mt: 0.5 }} variant="h3">
            {title}
          </Typography>
          {description && (
            <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
              {description}
            </Typography>
          )}
        </Box>
        {children}
      </CardContent>
    </Card>
  </Container>
)
