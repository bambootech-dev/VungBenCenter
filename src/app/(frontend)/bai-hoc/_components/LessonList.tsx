'use client'

import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import SearchOffRounded from '@mui/icons-material/SearchOffRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { visuallyHidden } from '@mui/utils'
import React, { useMemo, useState } from 'react'

import { normalizeSound } from '@/collections/Lessons/sound'
import { EmptyState } from '@/components/EmptyState'

import { LessonThumbnail } from './LessonThumbnail'

// Chỉ những gì cần để hiển thị card; trang server đã đọc bài học bằng quyền của user
export type LessonListItem = {
  id: number
  label: string
  sound: string
  thumbnailUrl: string | null
}

const normalize = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('vi')

// "th", "TH", "Âm Th" đều khớp bài "Th"; ô trống → hiển thị tất cả
export const matchesLesson = (lesson: Pick<LessonListItem, 'label' | 'sound'>, query: string) => {
  const keyword = normalize(query)

  if (!keyword) return true

  return (
    normalize(lesson.label).includes(keyword) ||
    normalize(lesson.sound).includes(normalize(normalizeSound(query)))
  )
}

export const LessonList = ({ lessons }: { lessons: LessonListItem[] }) => {
  const [query, setQuery] = useState('')

  const visibleLessons = useMemo(
    () => lessons.filter((lesson) => matchesLesson(lesson, query)),
    [lessons, query],
  )

  if (lessons.length === 0) {
    return <EmptyState message="Chưa có bài học nào." />
  }

  return (
    <>
      <Box role="search" sx={{ maxWidth: { md: 512 }, mb: { xs: 4, md: 5 } }}>
        <TextField
          autoComplete="off"
          fullWidth
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm bài học âm..."
          slotProps={{
            htmlInput: { 'aria-label': 'Tìm bài học âm' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded aria-hidden="true" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              // Search bar M3: viên thuốc cao 56px trên nền surface-container-high, không viền
              sx: {
                bgcolor: 'm3.surfaceContainerHigh',
                borderRadius: 999,
                fontSize: '1rem',
                minHeight: 56,
                pl: 2.5,
                '& .MuiOutlinedInput-notchedOutline': { border: 0 },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 2, borderColor: 'primary.main' },
              },
            },
          }}
          type="search"
          value={query}
        />
      </Box>

      {/* Báo số kết quả cho trình đọc màn hình khi lọc */}
      <Box aria-live="polite" component="p" sx={visuallyHidden}>
        {query.trim() ? `Tìm thấy ${visibleLessons.length} bài học` : ''}
      </Box>

      {visibleLessons.length === 0 ? (
        <EmptyState icon={<SearchOffRounded fontSize="inherit" />} message="Không tìm thấy bài học phù hợp." testId="lesson-search-empty" />
      ) : (
        // Số cột cố định theo màn hình: 1–2 bài vẫn giữ độ rộng card, căn từ trái
        <Box
          component="ul"
          data-testid="lesson-grid"
          sx={{
            display: 'grid',
            gap: { xs: 2.5, md: 3 },
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            listStyle: 'none',
            m: 0,
            p: 0,
          }}
        >
          {visibleLessons.map((lesson, index) => (
            <li key={lesson.id}>
              <Card
                sx={{
                  height: '100%',
                  '&:hover': { boxShadow: 2 },
                  '&:hover .lesson-thumb img': { transform: 'scale(1.03)' },
                  '&:hover .lesson-arrow': { bgcolor: 'primary.main', color: 'primary.contrastText' },
                }}
              >
                <CardActionArea data-testid="lesson-card" href={`/bai-hoc/${lesson.id}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%' }}>
                  <LessonThumbnail eager={index < 3} sound={lesson.sound} url={lesson.thumbnailUrl} />
                  <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5, justifyContent: 'space-between', px: 2, py: 2 }}>
                    <Typography component="span" variant="h4">
                      {lesson.label}
                    </Typography>
                    <Box
                      aria-hidden="true"
                      className="lesson-arrow"
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'm3.primaryContainer',
                        borderRadius: 4,
                        color: 'm3.onPrimaryContainer',
                        display: 'flex',
                        flexShrink: 0,
                        height: 48,
                        justifyContent: 'center',
                        transition: 'background-color 200ms, color 200ms',
                        width: 48,
                      }}
                    >
                      <ArrowForwardRounded />
                    </Box>
                  </Box>
                </CardActionArea>
              </Card>
            </li>
          ))}
        </Box>
      )}
    </>
  )
}
