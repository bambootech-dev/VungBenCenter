import type { CollectionConfig, RichTextField } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { admin } from '../../access/admin'
import { anyone } from '../../access/anyone'
import { getRequestLessonAccess, hasLesson } from '../../utilities/lessonAccess'
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
    // Thông tin công khai (tên âm, thứ tự, ảnh) để giới thiệu; nội dung 9 bước được bảo vệ
    // bằng field access của `steps` bên dưới (áp dụng cho REST, GraphQL và Local API)
    read: anyone,
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
      access: {
        // Chỉ trả nội dung khi người đọc có quyền còn hiệu lực với đúng bài này. Không có `doc`
        // (ví dụ lọc/sắp xếp theo nội dung bước) thì chỉ người xem được mọi bài mới được dùng.
        read: async ({ doc, req }) => {
          const access = await getRequestLessonAccess(req)

          return typeof doc?.id === 'number' ? hasLesson(access, doc.id) : access.all
        },
      },
      fields: LESSON_STEP_KEYS.map(stepField),
    },
  ],

  timestamps: true,
}
