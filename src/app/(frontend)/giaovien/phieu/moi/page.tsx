import type { Metadata } from 'next'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import DescriptionRounded from '@mui/icons-material/DescriptionRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { redirect } from 'next/navigation'
import React from 'react'

import { PageHeader } from '@/components/PageHeader'
import { requireActiveTeacher } from '@/utilities/requireActiveTeacher'
import { WORKSHEET_TEMPLATES } from '@/worksheetTemplates/definitions'

export const metadata: Metadata = {
  title: 'Tạo phiếu',
}

export default async function ChooseTemplatePage() {
  await requireActiveTeacher()

  // Chỉ có một mẫu thì mở thẳng form
  if (WORKSHEET_TEMPLATES.length === 1) {
    redirect(`/giaovien/phieu/moi/${WORKSHEET_TEMPLATES[0].code}`)
  }

  return (
    <>
      <PageHeader back={{ href: '/giaovien/phieu', label: 'Phiếu' }} eyebrow="Tạo phiếu" title="Chọn mẫu phiếu" />

      <Box
        component="ul"
        data-testid="template-list"
        sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, listStyle: 'none', m: 0, p: 0 }}
      >
        {WORKSHEET_TEMPLATES.map((template) => (
          <li key={template.code}>
            <Card component="article" data-testid="template-card" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardContent sx={{ display: 'flex', flex: 1, gap: 2 }}>
                <Box
                  aria-hidden="true"
                  sx={{
                    alignItems: 'center',
                    bgcolor: 'm3.primaryContainer',
                    borderRadius: 4,
                    color: 'm3.onPrimaryContainer',
                    display: 'flex',
                    flexShrink: 0,
                    height: 56,
                    justifyContent: 'center',
                    width: 56,
                  }}
                >
                  <DescriptionRounded />
                </Box>
                <Box>
                  <Typography component="h2" variant="h5">
                    {template.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {template.description}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, pt: 0 }}>
                <Button
                  aria-label={`Điền ${template.title}`}
                  endIcon={<ArrowForwardRounded />}
                  href={`/giaovien/phieu/moi/${template.code}`}
                  variant="contained"
                >
                  Điền phiếu này
                </Button>
              </CardActions>
            </Card>
          </li>
        ))}
      </Box>
    </>
  )
}
