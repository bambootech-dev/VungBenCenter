import Link from 'next/link'
import type { Payload } from 'payload'
import React from 'react'

import { ORDER_STATUS_LABELS, type OrderStatus } from '@/collections/Orders/status'
import { formatPrice, type PlanSnapshot } from '@/collections/Plans/plan'
import { grantState, GRANT_STATE_LABELS, type GrantState } from '@/collections/Subscriptions/state'
import type { User } from '@/payload-types'
import { formatVietnamDateTime } from '@/utilities/calendar'

const STATE_BADGES: Record<GrantState, string> = {
  active: 'text-bg-success',
  cancelled: 'text-bg-secondary',
  expired: 'text-bg-secondary',
  revoked: 'text-bg-danger',
  scheduled: 'text-bg-info',
}

const ORDER_BADGES: Record<OrderStatus, string> = {
  pending: 'text-bg-warning',
  paid: 'text-bg-success',
  cancelled: 'text-bg-secondary',
  refunded: 'text-bg-secondary',
}

type Props = {
  newOrderId: number | null
  payload: Payload
  user: User
}

/**
 * "Gói học của tôi": quyền học và đơn mua của chính người đang đăng nhập. Đọc bằng Local API với
 * `overrideAccess: false`, nên access (chỉ bản ghi của mình) được áp dụng.
 */
export const MyPlans = async ({ newOrderId, payload, user }: Props) => {
  const now = new Date()

  const [{ docs: grants }, { docs: orders }] = await Promise.all([
    payload.find({
      collection: 'subscriptions',
      depth: 0,
      overrideAccess: false,
      pagination: false,
      sort: '-startsAt',
      user,
    }),
    payload.find({
      collection: 'orders',
      depth: 0,
      limit: 20,
      overrideAccess: false,
      sort: '-createdAt',
      user,
    }),
  ])

  // Bài đang mở: hợp tất cả quyền còn hiệu lực (tên bài lấy từ bản chụp lúc kích hoạt)
  const unlocked = new Map<number, string>()

  for (const grant of grants) {
    if (grantState(grant, now) !== 'active') continue

    const labels = (grant.snapshot as Pick<PlanSnapshot, 'lessons'> | null)?.lessons ?? []

    for (const lesson of grant.lessons ?? []) {
      const id = typeof lesson === 'object' ? lesson.id : lesson
      unlocked.set(id, labels.find((item) => item.id === id)?.label ?? `Bài #${id}`)
    }
  }

  return (
    <section aria-labelledby="goi-hoc-cua-toi" className="mt-5" data-testid="my-plans">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 className="h3 mb-0" id="goi-hoc-cua-toi">
          Gói học của tôi
        </h2>
        <Link className="btn btn-outline-primary" href="/goi-hoc">
          <i aria-hidden="true" className="bi bi-bag-heart me-2" />
          Xem gói học
        </Link>
      </div>

      {newOrderId && (
        <div className="alert alert-success" role="status">
          Đã tạo đơn #{newOrderId}. Trung tâm sẽ xác nhận thanh toán, sau đó bài học được mở khóa tự động.
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-body p-4">
          <h3 className="h5">Bài đã mở khóa</h3>
          {unlocked.size === 0 ? (
            <p className="text-body-secondary mb-0" data-testid="unlocked-empty">
              Bạn chưa mở khóa bài học nào.
            </p>
          ) : (
            <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0" data-testid="unlocked-lessons">
              {[...unlocked].map(([id, label]) => (
                <li key={id}>
                  <Link className="btn btn-outline-primary" href={`/bai-hoc/${id}`}>
                    <i aria-hidden="true" className="bi bi-unlock-fill me-2" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h3 className="h5">Gói đã kích hoạt</h3>
      {grants.length === 0 ? (
        <p className="text-body-secondary">Chưa có gói nào được kích hoạt.</p>
      ) : (
        <div className="table-responsive mb-4">
          <table className="table table-hover align-middle bg-body" data-testid="my-subscriptions">
            <thead>
              <tr>
                <th scope="col">Gói</th>
                <th scope="col">Bài học</th>
                <th scope="col">Kích hoạt</th>
                <th scope="col">Hết hạn</th>
                <th scope="col">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {grants.map((grant) => {
                const snapshot = grant.snapshot as Partial<PlanSnapshot> | null
                const state = grantState(grant, now)

                return (
                  <tr key={grant.id}>
                    <td className="fw-bold">{snapshot?.name ?? 'Trung tâm cấp'}</td>
                    <td>{(snapshot?.lessons ?? []).map((lesson) => lesson.label).join(', ')}</td>
                    <td>{grant.startsAt ? formatVietnamDateTime(grant.startsAt) : '—'}</td>
                    <td>{grant.endsAt ? formatVietnamDateTime(grant.endsAt) : 'Không thời hạn'}</td>
                    <td>
                      <span className={`badge ${STATE_BADGES[state]}`}>{GRANT_STATE_LABELS[state]}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="h5">Lịch sử mua hàng</h3>
      {orders.length === 0 ? (
        <p className="text-body-secondary mb-0">Chưa có đơn mua nào.</p>
      ) : (
        <ul className="list-group" data-testid="my-orders">
          {orders.map((order) => {
            const snapshot = order.planSnapshot as Partial<PlanSnapshot> | null

            return (
              <li
                className="list-group-item d-flex flex-wrap align-items-center justify-content-between gap-2"
                key={order.id}
              >
                <span>
                  <span className="fw-bold">
                    Đơn #{order.id} — {snapshot?.name}
                  </span>
                  <span className="d-block small text-body-secondary">
                    {formatVietnamDateTime(order.createdAt)} · {formatPrice(order.amount ?? 0)}
                  </span>
                </span>
                <span className={`badge ${ORDER_BADGES[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
