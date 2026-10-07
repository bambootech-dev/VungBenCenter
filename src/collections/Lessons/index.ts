import type { CollectionConfig, RichTextField } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { activeUser } from '../../access/activeUser'
import { admin } from '../../access/admin'
import { normalizeSound } from './sound'
import { LESSON_STEP_KEYS } from './steps'

const stepEditor = lexicalEditor({
  features: ({ rootFeatures }) => {
    return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
  },
})

const stepField = (name: string, index: number): RichTextField => ({
  name,
  label: `Bước ${index + 1}`,
  type: 'richText',
  editor: stepEditor,
})

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  labels: {
    singular: 'Bài học',
    plural: 'Bài học',
  },

  access: {
    create: admin,
    delete: admin,
    // Không có fallback công khai: khách không đọc được bài học qua REST, GraphQL hay Local API
    read: activeUser,
    update: admin,
  },

  admin: {
    defaultColumns: ['sound', 'order', 'updatedAt'],
    useAsTitle: 'sound',
  },

  defaultSort: 'order',

  fields: [
    {
      name: 'sound',
      label: 'Âm',
      type: 'text',
      required: true,
      admin: {
        description: 'Chỉ nhập tên âm, ví dụ: Th, Tr, Ch. Trang học tự hiển thị "Âm Th".',
      },
      hooks: {
        beforeValidate: [({ value }) => (typeof value === 'string' ? normalizeSound(value) : value)],
      },
    },
    {
      name: 'order',
      label: 'Thứ tự',
      type: 'number',
      required: true,
      index: true,
    },
    {
      name: 'thumbnail',
      label: 'Ảnh đại diện',
      type: 'upload',
      relationTo: 'media',
    },
    {
      // Chín field cố định (không dùng Array) để sau này từng bước có thể đổi sang schema riêng
      name: 'steps',
      label: 'Các bước',
      type: 'group',
      fields: LESSON_STEP_KEYS.map(stepField),
    },
  ],

  timestamps: true,
}
