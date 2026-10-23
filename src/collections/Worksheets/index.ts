import {
  APIError,
  type CollectionBeforeDeleteHook,
  type CollectionConfig,
  type FieldHook,
  type RelationshipFieldSingleValidation,
  type TextFieldSingleValidation,
} from 'payload'

import { array, relationship, text } from 'payload/shared'

import { activeTeacherOrAdmin } from '../../access/activeTeacherOrAdmin'
import { admin } from '../../access/admin'
import {
  QUESTION_KEY_MAX_LENGTH,
  findDuplicateQuestionKeys,
  normalizeQuestionKey,
  normalizeText,
  validateQuestionKey,
} from './questions'

// Bỏ khoảng trắng đầu/cuối để chuỗi chỉ có khoảng trắng bị coi là trống (required)
const trimText: FieldHook = ({ value }) => (typeof value === 'string' ? normalizeText(value) : value)

const validateKey: TextFieldSingleValidation = (value, options) => {
  const result = text(value, options)

  if (result !== true || typeof value !== 'string') return result

  return validateQuestionKey(value)
}

// Payload chỉ kiểm tra định dạng ID; ID không tồn tại sẽ bị khóa ngoại chặn với lỗi 500
const validateLesson: RelationshipFieldSingleValidation = async (value, options) => {
  const result = await relationship(value, options)

  if (result !== true || value === null || value === undefined) return result

  const { totalDocs } = await options.req.payload.count({
    collection: 'lessons',
    overrideAccess: true,
    req: options.req,
    where: { id: { equals: typeof value === 'object' ? value.value : value } },
  })

  return totalDocs > 0 ? true : 'Bài học đã chọn không tồn tại.'
}

// Bài nộp phải luôn trỏ được về worksheet gốc; chạy cả khi xóa qua Local API với overrideAccess
const preventDeleteWithSubmissions: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { totalDocs } = await req.payload.count({
    collection: 'worksheet-submissions',
    overrideAccess: true,
    req,
    where: { worksheet: { equals: id } },
  })

  if (totalDocs > 0) {
    throw new APIError(`Không xóa được worksheet đã có ${totalDocs} bài nộp.`, 409, undefined, true)
  }
}

export const Worksheets: CollectionConfig = {
  slug: 'worksheets',
  labels: {
    singular: 'Worksheet',
    plural: 'Worksheet',
  },

  access: {
    create: admin,
    delete: admin,
    // Giáo viên đọc để điền phiếu (iteration sau). Học sinh và khách không đọc được.
    read: activeTeacherOrAdmin,
    update: admin,
  },

  admin: {
    defaultColumns: ['title', 'lesson', 'updatedAt'],
    // Phiếu mới dùng mẫu hệ thống (src/worksheetTemplates); collection này chỉ còn cho bài nộp kiểu cũ
    description:
      'Worksheet kiểu cũ, chỉ giữ để đọc lại các bài đã nộp trước đây. Không cần tạo mới: Giáo viên tạo phiếu theo mẫu có sẵn.',
    useAsTitle: 'title',
  },

  hooks: {
    beforeDelete: [preventDeleteWithSubmissions],
  },

  fields: [
    {
      name: 'title',
      label: 'Tiêu đề',
      type: 'text',
      required: true,
      hooks: {
        beforeValidate: [trimText],
      },
    },
    {
      name: 'instructions',
      label: 'Hướng dẫn',
      type: 'textarea',
      hooks: {
        beforeValidate: [trimText],
      },
    },
    {
      name: 'lesson',
      label: 'Bài học',
      type: 'relationship',
      relationTo: 'lessons',
      admin: {
        description: 'Không bắt buộc. Chọn nếu worksheet dùng cho một bài học cụ thể.',
      },
      validate: validateLesson,
    },
    {
      name: 'questions',
      label: 'Câu hỏi',
      type: 'array',
      required: true,
      minRows: 1,
      labels: {
        singular: 'Câu hỏi',
        plural: 'Câu hỏi',
      },
      admin: {
        description: 'Mỗi câu hỏi là một ô nhập văn bản.',
      },
      validate: (value, options) => {
        const duplicates = findDuplicateQuestionKeys(value)

        if (duplicates.length > 0) {
          return `Mã câu hỏi bị trùng trong worksheet: ${duplicates.join(', ')}.`
        }

        return array(value, options)
      },
      fields: [
        {
          name: 'key',
          label: 'Mã câu hỏi',
          type: 'text',
          required: true,
          maxLength: QUESTION_KEY_MAX_LENGTH,
          admin: {
            description:
              'Định danh cố định, duy nhất trong worksheet, ví dụ: muc-tieu. Không nên đổi sau khi đã có bài nộp.',
          },
          hooks: {
            beforeValidate: [
              ({ value }) => (typeof value === 'string' ? normalizeQuestionKey(value) : value),
            ],
          },
          validate: validateKey,
        },
        {
          name: 'label',
          label: 'Nội dung câu hỏi',
          type: 'text',
          required: true,
          hooks: {
            beforeValidate: [trimText],
          },
        },
        {
          name: 'required',
          label: 'Bắt buộc trả lời',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],

  timestamps: true,
}
