import { APIError, type CollectionConfig } from 'payload'

import { admin } from '../../access/admin'
import { adminOrOwner } from '../../access/adminOrOwner'
import { formatSoundLabel } from '../Lessons/sound'
import { auditTrail } from '../AuditLogs/audit'
import { computeEndsAt, type PlanSnapshot } from '../Plans/plan'
import { ORDER_ACTIVATION_CONTEXT } from '../Subscriptions'
import { SUBSCRIPTIONS_SLUG } from '@/utilities/lessonAccess'

import { ORDER_STATUS_LABELS, ORDER_TRANSITIONS, type OrderStatus, PAYMENT_METHOD_LABELS } from './status'

export const ORDERS_SLUG = 'orders'

// Field do server đặt lúc tạo đơn, không đổi về sau (giá và điều kiện tại thời điểm mua)
const IMMUTABLE_FIELDS = ['user', 'plan', 'planSnapshot', 'amount', 'currency', 'title'] as const
// Người mua không được tự đặt các field này khi tạo đơn
const ADMIN_ONLY_ON_CREATE = ['status', 'paidAt', 'confirmedBy', 'paymentMethod', 'transactionRef'] as const

const idOf = (value: unknown) =>
  value && typeof value === 'object' && 'id' in value ? Number((value as { id: unknown }).id) : Number(value)

// Relationship trong bản gốc có thể đã được populate: lưu lại bằng ID
const restore = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value) && 'id' in value ? (value as { id: unknown }).id : value

const audit = auditTrail({
  label: 'Đơn mua',
  fields: ['status', 'paymentMethod', 'transactionRef', 'paidAt', 'confirmedBy', 'note'],
  relatedUser: (doc) => doc.user,
  describe: (doc) => String(doc.title ?? ''),
})

/**
 * Đơn mua gói. Người mua chỉ tạo được đơn "Chờ thanh toán" cho chính mình; giá và bản chụp gói do
 * server lấy từ gói. Chỉ Admin đổi trạng thái: xác nhận thanh toán (pending → paid) kích hoạt quyền
 * học trong cùng transaction; hoàn tiền (paid → refunded) thu hồi quyền của đơn đó.
 */
export const Orders: CollectionConfig = {
  slug: ORDERS_SLUG,
  labels: {
    singular: 'Đơn mua',
    plural: 'Đơn mua',
  },

  access: {
    // Học sinh / Phụ huynh active đặt mua cho chính mình; Admin tạo hộ
    create: ({ req: { user } }) =>
      Boolean(user && user.accountStatus === 'active' && (user.role === 'admin' || user.role === 'hocsinh')),
    delete: () => false,
    read: adminOrOwner,
    update: admin,
  },

  admin: {
    defaultColumns: ['title', 'user', 'amount', 'status', 'createdAt', 'paidAt'],
    description:
      'Xác nhận thanh toán: mở đơn "Chờ thanh toán", chọn phương thức, nhập mã giao dịch (nếu có), đổi trạng thái sang "Đã thanh toán" rồi lưu. Quyền học được kích hoạt tự động.',
    group: 'Gói học & quyền học',
    useAsTitle: 'title',
  },

  defaultSort: '-createdAt',

  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        const isAdmin = req.user?.role === 'admin'

        if (operation === 'create') {
          if (!isAdmin) {
            for (const field of ADMIN_ONLY_ON_CREATE) delete data[field]
            data.user = req.user?.id
          }

          // Mọi đơn bắt đầu ở "Chờ thanh toán"; kích hoạt chỉ qua bước xác nhận
          data.status = 'pending'
          delete data.paidAt
          delete data.confirmedBy

          if (!data.user || !data.plan) {
            throw new APIError('Thiếu người mua hoặc gói học.', 400, undefined, true)
          }

          const plan = await req.payload
            .findByID({
              collection: 'plans',
              depth: 1,
              id: idOf(data.plan),
              overrideAccess: true,
              populate: { lessons: { sound: true } },
              req,
            })
            .catch(() => null)

          if (!plan || (!isAdmin && !plan.isActive)) {
            throw new APIError('Gói học không tồn tại hoặc đã ngừng bán.', 400, undefined, true)
          }

          if (!isAdmin) {
            const { totalDocs } = await req.payload.count({
              collection: ORDERS_SLUG,
              overrideAccess: true,
              req,
              where: {
                and: [{ user: { equals: data.user } }, { plan: { equals: plan.id } }, { status: { equals: 'pending' } }],
              },
            })

            if (totalDocs > 0) {
              throw new APIError('Bạn đã có một đơn đang chờ thanh toán cho gói này.', 409, undefined, true)
            }
          }

          const snapshot: PlanSnapshot = {
            planId: plan.id,
            name: plan.name,
            code: plan.code,
            kind: plan.kind,
            durationType: plan.durationType,
            durationMonths: plan.durationMonths ?? null,
            price: plan.price,
            currency: 'VND',
            lessons: (plan.lessons ?? []).flatMap((lesson) =>
              typeof lesson === 'object' ? [{ id: lesson.id, label: formatSoundLabel(lesson.sound) }] : [],
            ),
          }

          const buyer = await req.payload.findByID({
            collection: 'users',
            depth: 0,
            id: idOf(data.user),
            overrideAccess: true,
            req,
          })

          data.plan = plan.id
          data.planSnapshot = snapshot
          data.amount = plan.price
          data.currency = 'VND'
          data.title = `${plan.name} — ${buyer.email}`

          return data
        }

        // Cập nhật (chỉ Admin): giữ nguyên dữ liệu mua (gán lại giá trị gốc), chỉ cho chuyển trạng thái hợp lệ
        for (const field of IMMUTABLE_FIELDS) data[field] = restore(originalDoc[field])

        const from = originalDoc.status as OrderStatus
        const to = (data.status ?? from) as OrderStatus

        if (to !== from && !ORDER_TRANSITIONS[from].includes(to)) {
          throw new APIError(
            `Không thể chuyển đơn từ "${ORDER_STATUS_LABELS[from]}" sang "${ORDER_STATUS_LABELS[to]}".`,
            400,
            undefined,
            true,
          )
        }

        if (to === 'paid' && from === 'pending') {
          if (!(data.paymentMethod ?? originalDoc.paymentMethod)) {
            throw new APIError('Chọn phương thức thanh toán trước khi xác nhận.', 400, undefined, true)
          }

          // Thời điểm kích hoạt quyền học do server đặt, không lấy từ dữ liệu gửi lên
          data.paidAt = new Date().toISOString()
          data.confirmedBy = req.user?.id
        } else {
          // Thời điểm và người xác nhận chỉ được ghi đúng một lần, lúc xác nhận
          data.paidAt = originalDoc.paidAt ?? null
          data.confirmedBy = restore(originalDoc.confirmedBy) ?? null
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, previousDoc, req }) => {
        if (operation !== 'update') return doc

        if (previousDoc.status === 'pending' && doc.status === 'paid') {
          const snapshot = doc.planSnapshot as PlanSnapshot
          const startsAt = new Date(doc.paidAt)
          const endsAt = computeEndsAt(snapshot, startsAt)

          // Cùng transaction với việc đổi trạng thái đơn; `order` là unique nên một đơn
          // không bao giờ tạo hai quyền học, kể cả khi hai Admin xác nhận cùng lúc
          await req.payload.create({
            collection: SUBSCRIPTIONS_SLUG,
            context: { [ORDER_ACTIVATION_CONTEXT]: true },
            overrideAccess: true,
            req,
            data: {
              user: idOf(doc.user),
              source: 'order',
              plan: snapshot.planId,
              order: doc.id,
              lessons: snapshot.lessons.map((lesson) => lesson.id),
              startsAt: startsAt.toISOString(),
              endsAt: endsAt?.toISOString() ?? null,
              noExpiry: endsAt === null,
              status: 'active',
              snapshot,
            },
          })
        }

        if (previousDoc.status === 'paid' && doc.status === 'refunded') {
          await req.payload.update({
            collection: SUBSCRIPTIONS_SLUG,
            overrideAccess: true,
            req,
            where: { order: { equals: doc.id } },
            data: { status: 'revoked', statusReason: `Hoàn tiền đơn #${doc.id}` },
          })
        }

        return doc
      },
      audit.afterChange,
    ],
  },

  fields: [
    {
      name: 'title',
      label: 'Đơn',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'user',
      label: 'Người mua',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'plan',
      label: 'Gói học',
      type: 'relationship',
      relationTo: 'plans',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'amount',
          label: 'Giá lúc mua',
          type: 'number',
          admin: { readOnly: true },
        },
        {
          name: 'currency',
          label: 'Tiền tệ',
          type: 'select',
          defaultValue: 'VND',
          options: [{ label: 'VND', value: 'VND' }],
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ label, value })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'paymentMethod',
      label: 'Phương thức thanh toán',
      type: 'select',
      options: Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ label, value })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'transactionRef',
      label: 'Mã giao dịch',
      type: 'text',
      admin: { position: 'sidebar' },
    },
    {
      name: 'paidAt',
      label: 'Thời điểm xác nhận thanh toán',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' }, position: 'sidebar', readOnly: true },
    },
    {
      name: 'confirmedBy',
      label: 'Người xác nhận',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'planSnapshot',
      label: 'Bản chụp gói lúc đặt',
      type: 'json',
      admin: { readOnly: true },
    },
    {
      name: 'note',
      label: 'Ghi chú',
      type: 'textarea',
    },
  ],

  timestamps: true,
}
