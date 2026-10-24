import {
  APIError,
  ValidationError,
  type Access,
  type CollectionBeforeChangeHook,
  type CollectionConfig,
} from 'payload'

import { getTemplate } from '@/worksheetTemplates/definitions'
import { normalizeTemplateValues } from '@/worksheetTemplates/validate'

import { activeTeacher } from '../../access/activeTeacher'
import { QUESTION_KEY_MAX_LENGTH } from '../Worksheets/questions'
import { ANSWER_MAX_LENGTH } from './answers'

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

// Bài nộp theo mẫu hệ thống (templateCode) hay bài kiểu cũ theo worksheet do Admin soạn.
// admin.condition nhận (data, siblingData): `data` là toàn bộ document đang mở
const isTemplateSubmission = (data: { templateCode?: unknown } | undefined) => Boolean(data?.templateCode)
const isLegacySubmission = (data: { templateCode?: unknown } | undefined) => !data?.templateCode

/**
 * Server tự đặt giáo viên, thời gian nộp, tiêu đề và bản chụp mẫu; mọi giá trị client gửi cho các
 * field này đều bị bỏ. Chỉ nhận `templateCode` (mẫu hệ thống) và `data` (giá trị đã điền).
 * Chạy trước bước validate/field access của Payload, nên kể cả Local API với overrideAccess: true
 * cũng phải có req.user là Giáo viên.
 */
const prepareSubmission: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  // Không cho sửa bài đã nộp, kể cả qua Local API bỏ qua access control
  if (operation !== 'create') {
    throw new APIError('Bài nộp không thể chỉnh sửa.', 403, undefined, true)
  }

  const { user } = req

  if (!user || user.role !== 'giaovien') {
    throw new APIError('Chỉ Giáo viên đăng nhập mới nộp được phiếu.', 403, undefined, true)
  }

  // Bài mới luôn theo mẫu hệ thống; luồng worksheet do Admin soạn chỉ còn để đọc bài cũ
  const template = getTemplate(data.templateCode)

  if (!template) {
    throw new ValidationError({
      collection: WORKSHEET_SUBMISSIONS_SLUG,
      errors: [{ path: 'templateCode', message: 'Mẫu phiếu không tồn tại.' }],
      req,
    })
  }

  const { errors, values } = normalizeTemplateValues(template, data.data)

  if (errors.length > 0) {
    throw new ValidationError({ collection: WORKSHEET_SUBMISSIONS_SLUG, errors, req })
  }

  return {
    data: values,
    submittedAt: new Date().toISOString(),
    teacher: user.id,
    templateCode: template.code,
    // Bản sao sâu: bài đã nộp không đổi khi định nghĩa mẫu trong code thay đổi
    templateSnapshot: JSON.parse(JSON.stringify(template)),
    templateVersion: template.version,
    title: template.title,
  }
}

export const WorksheetSubmissions: CollectionConfig = {
  slug: WORKSHEET_SUBMISSIONS_SLUG,
  labels: {
    singular: 'Phiếu đã nộp',
    plural: 'Phiếu đã nộp',
  },

  access: {
    create: activeTeacher,
    // Không ai sửa/xóa được bài nộp qua REST, GraphQL hay /admin
    delete: () => false,
    read: readOwnOrAdmin,
    update: () => false,
  },

  admin: {
    // Lọc theo giáo viên: nút "Filters" của danh sách, field "Giáo viên nộp"
    defaultColumns: ['title', 'teacher', 'submittedAt'],
    description: 'Phiếu Giáo viên đã nộp. Chỉ xem, không sửa hoặc xóa được.',
    listSearchableFields: ['title'],
    useAsTitle: 'title',
  },

  defaultSort: '-submittedAt',

  hooks: {
    beforeChange: [prepareSubmission],
  },

  fields: [
    {
      // Tên mẫu (hoặc tên worksheet với bài cũ) lúc nộp, để hiển thị và tìm trong danh sách
      name: 'title',
      label: 'Tên phiếu',
      type: 'text',
      admin: { readOnly: true },
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
      name: 'templateCode',
      label: 'Mã mẫu',
      type: 'text',
      index: true,
      admin: { condition: isTemplateSubmission, readOnly: true },
    },
    {
      name: 'templateVersion',
      label: 'Phiên bản mẫu',
      type: 'number',
      admin: { condition: isTemplateSubmission, readOnly: true },
    },
    {
      // Hiển thị phiếu theo mẫu (đọc từ templateSnapshot + data) trong /admin
      name: 'preview',
      type: 'ui',
      admin: {
        components: {
          Field: '/collections/WorksheetSubmissions/SubmissionPreview#SubmissionPreview',
        },
        condition: isTemplateSubmission,
      },
    },
    {
      // Bản chụp mẫu lúc nộp (cấu trúc đầy đủ), để bài cũ hiển thị đúng khi mẫu được cập nhật
      name: 'templateSnapshot',
      label: 'Mẫu lúc nộp',
      type: 'json',
      admin: { hidden: true },
    },
    {
      // Giá trị giáo viên đã điền, theo key của mẫu
      name: 'data',
      label: 'Dữ liệu phiếu',
      type: 'json',
      admin: { hidden: true },
    },

    // Bài nộp kiểu cũ (worksheet do Admin soạn): chỉ còn để đọc lịch sử
    {
      name: 'worksheet',
      label: 'Worksheet (kiểu cũ)',
      type: 'relationship',
      relationTo: 'worksheets',
      index: true,
      admin: { condition: isLegacySubmission, readOnly: true },
    },
    {
      // Bản chụp đề lúc nộp: giữ nguyên ý nghĩa bài nộp khi worksheet gốc bị sửa sau này
      name: 'worksheetSnapshot',
      label: 'Đề lúc nộp',
      type: 'group',
      admin: {
        condition: isLegacySubmission,
        description: 'Server sao chép từ worksheet gốc khi nộp.',
        readOnly: true,
      },
      fields: [
        {
          name: 'title',
          label: 'Tiêu đề',
          type: 'text',
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
        condition: isLegacySubmission,
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
