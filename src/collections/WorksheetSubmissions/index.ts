import {
  APIError,
  ValidationError,
  type Access,
  type CollectionBeforeChangeHook,
  type CollectionConfig,
} from 'payload'

import { activeTeacher } from '../../access/activeTeacher'
import { QUESTION_KEY_MAX_LENGTH } from '../Worksheets/questions'
import { ANSWER_MAX_LENGTH, normalizeAnswers } from './answers'

export const WORKSHEET_SUBMISSIONS_SLUG = 'worksheet-submissions'

// Admin đọc tất cả; Giáo viên active chỉ đọc bài của chính mình (lọc ở query, áp dụng cho cả danh sách và ID)
const readOwnOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false

  if (user.role === 'admin') return true

  if (user.role === 'giaovien' && user.accountStatus === 'active') {
    return { teacher: { equals: user.id } }
  }

  return false
}

const extractID = (value: unknown): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') return value

  if (value && typeof value === 'object' && 'id' in value) {
    const { id } = value as { id: unknown }

    if (typeof id === 'number' || typeof id === 'string') return id
  }

  return null
}

/**
 * Server tự đặt giáo viên, thời gian nộp và bản chụp đề; mọi giá trị client gửi cho các field
 * này đều bị bỏ. Chạy trước bước validate/field access của Payload, nên kể cả Local API với
 * overrideAccess: true cũng phải có req.user là Giáo viên.
 */
const prepareSubmission: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  // Bản đầu không cho sửa bài đã nộp, kể cả qua Local API bỏ qua access control
  if (operation !== 'create') {
    throw new APIError('Bài nộp không thể chỉnh sửa.', 403, undefined, true)
  }

  const { user } = req

  if (!user || user.role !== 'giaovien') {
    throw new APIError('Chỉ Giáo viên đăng nhập mới nộp được worksheet.', 403, undefined, true)
  }

  const worksheetID = extractID(data.worksheet)

  const worksheet =
    worksheetID === null
      ? null
      : await req.payload
          .findByID({
            collection: 'worksheets',
            depth: 0,
            disableErrors: true,
            id: worksheetID,
            // Kiểm tra quyền đọc worksheet của chính người nộp
            overrideAccess: false,
            req,
            user,
          })
          .catch(() => null)

  if (!worksheet) {
    throw new ValidationError({
      collection: WORKSHEET_SUBMISSIONS_SLUG,
      errors: [{ path: 'worksheet', message: 'Worksheet không tồn tại hoặc bạn không có quyền đọc.' }],
      req,
    })
  }

  const questions = worksheet.questions.map(({ key, label, required }) => ({
    key,
    label,
    required: Boolean(required),
  }))

  const { answers, errors } = normalizeAnswers(data.answers, questions)

  if (errors.length > 0) {
    throw new ValidationError({ collection: WORKSHEET_SUBMISSIONS_SLUG, errors, req })
  }

  return {
    answers,
    submittedAt: new Date().toISOString(),
    teacher: user.id,
    worksheet: worksheet.id,
    worksheetSnapshot: {
      title: worksheet.title,
      instructions: worksheet.instructions ?? null,
      questions,
    },
  }
}

export const WorksheetSubmissions: CollectionConfig = {
  slug: WORKSHEET_SUBMISSIONS_SLUG,
  labels: {
    singular: 'Bài nộp worksheet',
    plural: 'Bài nộp worksheet',
  },

  access: {
    create: activeTeacher,
    // Bản đầu: không ai sửa/xóa được bài nộp qua REST, GraphQL hay /admin
    delete: () => false,
    read: readOwnOrAdmin,
    update: () => false,
  },

  admin: {
    // Lọc theo giáo viên: nút "Filters" của danh sách, field "Giáo viên nộp"
    defaultColumns: ['id', 'teacher', 'worksheet', 'submittedAt'],
    description: 'Bài Giáo viên đã nộp. Chỉ xem, không sửa hoặc xóa được.',
  },

  defaultSort: '-submittedAt',

  hooks: {
    beforeChange: [prepareSubmission],
  },

  fields: [
    {
      name: 'worksheet',
      label: 'Worksheet',
      type: 'relationship',
      relationTo: 'worksheets',
      required: true,
      index: true,
    },
    {
      name: 'teacher',
      label: 'Giáo viên nộp',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        description: 'Lấy từ phiên đăng nhập.',
        readOnly: true,
      },
    },
    {
      name: 'submittedAt',
      label: 'Thời gian nộp',
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Do server đặt khi nộp.',
        readOnly: true,
      },
    },
    {
      // Bản chụp đề lúc nộp: giữ nguyên ý nghĩa bài nộp khi worksheet gốc bị sửa sau này
      name: 'worksheetSnapshot',
      label: 'Đề lúc nộp',
      type: 'group',
      admin: {
        description: 'Server sao chép từ worksheet gốc khi nộp.',
        readOnly: true,
      },
      fields: [
        {
          name: 'title',
          label: 'Tiêu đề',
          type: 'text',
          required: true,
        },
        {
          name: 'instructions',
          label: 'Hướng dẫn',
          type: 'textarea',
        },
        {
          name: 'questions',
          label: 'Câu hỏi',
          type: 'array',
          // Tên bảng mặc định làm tên index vượt giới hạn 63 ký tự của Postgres
          dbName: 'worksheet_submissions_snapshot_questions',
          required: true,
          minRows: 1,
          admin: {
            components: {
              RowLabel: '/collections/WorksheetSubmissions/RowLabels#SnapshotQuestionRowLabel',
            },
            initCollapsed: false,
          },
          fields: [
            {
              name: 'key',
              label: 'Mã câu hỏi',
              type: 'text',
              required: true,
              maxLength: QUESTION_KEY_MAX_LENGTH,
            },
            {
              name: 'label',
              label: 'Nội dung câu hỏi',
              type: 'text',
              required: true,
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
    },
    {
      name: 'answers',
      label: 'Câu trả lời',
      type: 'array',
      admin: {
        components: {
          RowLabel: '/collections/WorksheetSubmissions/RowLabels#AnswerRowLabel',
        },
        description: 'Chỉ lưu câu đã trả lời; câu không bắt buộc bỏ trống sẽ không có dòng.',
        initCollapsed: false,
        readOnly: true,
      },
      fields: [
        {
          name: 'questionKey',
          label: 'Mã câu hỏi',
          type: 'text',
          required: true,
          maxLength: QUESTION_KEY_MAX_LENGTH,
        },
        {
          name: 'value',
          label: 'Câu trả lời',
          type: 'textarea',
          required: true,
          maxLength: ANSWER_MAX_LENGTH,
        },
      ],
    },
  ],

  timestamps: true,
}
