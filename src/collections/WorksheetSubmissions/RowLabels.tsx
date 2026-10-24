'use client'

import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

// Nhãn dòng trong /admin: hiện câu hỏi / mã câu hỏi thay vì "Câu trả lời 01"

export const SnapshotQuestionRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ key?: string; label?: string }>()

  return <span>{data?.label ? `${data.label} (${data.key})` : `Câu hỏi ${(rowNumber ?? 0) + 1}`}</span>
}

export const AnswerRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ questionKey?: string }>()

  return <span>{data?.questionKey ? `Trả lời câu "${data.questionKey}"` : `Câu trả lời ${(rowNumber ?? 0) + 1}`}</span>
}
