import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import React from 'react'

export default function NotFound() {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 10, md: 14 } }}>
      <Card>
        <CardContent sx={{ p: { xs: 4, md: 6 }, textAlign: 'center' }}>
          <Typography color="primary" component="h1" sx={{ fontSize: { xs: '4rem', md: '5rem' }, lineHeight: 1 }} variant="h1">
            404
          </Typography>
          <Typography sx={{ mb: 4, mt: 2 }} variant="subtitle1">
            Không tìm thấy trang bạn yêu cầu.
          </Typography>
          <Button href="/" size="large" variant="contained">
            Về trang chủ
          </Button>
        </CardContent>
      </Card>
    </Container>
  )
}
