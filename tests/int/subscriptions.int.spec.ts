// @vitest-environment node
import config from '@payload-config'
import { GRAPHQL_POST } from '@payloadcms/next/routes'
import { getPayload, handleEndpoints, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { LESSON_STEP_KEYS } from '@/collections/Lessons/steps'
import type { Lesson, Order, Plan, Subscription, User } from '@/payload-types'
import { addCalendarMonths } from '@/utilities/calendar'
import { canAccessLesson, getLessonAccess } from '@/utilities/lessonAccess'

import { assertConnectedToLocalTestDatabase } from '../helpers/localTestDatabase'

// Chỉ chạy trên database local trong .env.test (guard trong vitest.setup.ts)

let payload: Payload

const PASSWORD = 'MatKhau123!'
const SECRET = 'NOI-DUNG-TRA-PHI'

const richText = (text: string) => ({
  root: {
    type: 'root',
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        version: 1,
        children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 }],
      },
    ],
  },
})

const asUser = (user: User) => ({ ...user, collection: 'users' as const })

const authHeaders = (token?: string): Record<string, string> => (token ? { Authorization: `JWT ${token}` } : {})

const rest = (
  path: string,
  { body, method = 'GET', token }: { body?: unknown; method?: string; token?: string } = {},
) =>
  handleEndpoints({
    config,
    request: new Request(`http://localhost:3000/api${path}`, {
      method,
      headers: { ...authHeaders(token), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    }),
  })

const graphql = (query: string, token?: string) =>
  GRAPHQL_POST(config)(
    new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ query }),
    }),
  )

const loginToken = async (email: string) => {
  const { token } = await payload.login({ collection: 'users', data: { email, password: PASSWORD } })
  if (!token) throw new Error(`Không lấy được token cho ${email}`)
  return token
}

const createUser = (email: string, role: User['role'], accountStatus: User['accountStatus'] = 'active') =>
  payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { name: email, email, password: PASSWORD, role, accountStatus },
  })

let admin: User
let studentA: User
let studentB: User
let teacher: User
let pendingTeacher: User
const lessons = {} as Record<'ch' | 'hu' | 'r' | 't' | 'th' | 'tr', Lesson>
let singleTh: Plan
let bundle: Plan

const adminCtx = () => ({ overrideAccess: false, user: asUser(admin) })

const createPlan = (data: Partial<Plan>) =>
  payload.create({ collection: 'plans', ...adminCtx(), data: { currency: 'VND', isActive: true, ...data } as never })

const order = (user: User, plan: Plan) =>
  payload.create({ collection: 'orders', overrideAccess: false, user: asUser(user), data: { plan: plan.id } as never })

const confirm = (target: Order) =>
  payload.update({
    collection: 'orders',
    id: target.id,
    ...adminCtx(),
    data: { status: 'paid', paymentMethod: 'bank_transfer', transactionRef: 'CK-THU-NGHIEM' },
  })

const buy = async (user: User, plan: Plan) => confirm(await order(user, plan))

const grantsOf = (user: User) =>
  payload.find({ collection: 'subscriptions', depth: 0, pagination: false, where: { user: { equals: user.id } } })

const accessibleIds = async (user: User, now?: Date) => {
  const fresh = await payload.findByID({ collection: 'users', id: user.id })
  const access = await getLessonAccess({ payload, user: fresh, now })
  return access.all ? 'all' : [...access.lessonIds].sort((a, b) => a - b)
}

const ids = (...keys: (keyof typeof lessons)[]) => keys.map((key) => lessons[key].id).sort((a, b) => a - b)

const lessonText = async (lessonId: number, token?: string) => (await rest(`/lessons/${lessonId}`, { token })).text()

const clear = async () => {
  for (const collection of ['audit-logs', 'subscriptions', 'orders', 'plans', 'lessons', 'users'] as const) {
    await payload.db.deleteMany({ collection, where: {} })
  }
}

beforeAll(async () => {
  payload = await getPayload({ config })
  await assertConnectedToLocalTestDatabase(payload.db)
})

afterAll(clear)

beforeEach(async () => {
  await clear()

  admin = await createUser('admin@test.local', 'admin')
  studentA = await createUser('hs-a@test.local', 'hocsinh')
  studentB = await createUser('hs-b@test.local', 'hocsinh')
  teacher = await createUser('gv@test.local', 'giaovien')
  pendingTeacher = await createUser('gv-pending@test.local', 'giaovien', 'pending')

  for (const [order, sound] of (['th', 'r', 't', 'hu', 'ch', 'tr'] as const).entries()) {
    lessons[sound] = await payload.create({
      collection: 'lessons',
      overrideAccess: true,
      data: {
        sound,
        order,
        steps: Object.fromEntries(LESSON_STEP_KEYS.map((key) => [key, richText(`${SECRET} ${sound} ${key}`)])),
      },
    })
  }

  singleTh = await createPlan({
    name: 'Âm Th',
    code: 'am-th',
    kind: 'single',
    price: 99000,
    durationType: 'lifetime',
    lessons: [lessons.th.id],
  })
  bundle = await createPlan({
    name: 'Luyện phát âm cơ bản',
    code: 'co-ban',
    kind: 'bundle',
    price: 399000,
    durationType: 'months',
    durationMonths: 1,
    lessons: ids('r', 'th', 't', 'hu', 'ch'),
  })
})

describe('Nội dung bài học chỉ trả về khi có quyền', () => {
  it('khách: danh sách công khai (tên âm) nhưng không có nội dung các bước (REST, GraphQL)', async () => {
    const list = await rest('/lessons?depth=2')
    const text = await list.text()

    expect(list.status).toBe(200)
    expect(JSON.parse(text).docs).toHaveLength(6)
    expect(text).toContain('"sound":"th"')
    expect(text).not.toContain(SECRET)

    expect(await lessonText(lessons.th.id)).not.toContain(SECRET)

    const gql = await graphql(`{ Lessons { docs { sound steps { step1 } } } Lesson(id: ${lessons.th.id}) { steps { step9 } } }`)
    expect(await gql.text()).not.toContain(SECRET)
  })

  it('học sinh active chưa mua không đọc được nội dung (REST, GraphQL, Local API)', async () => {
    const token = await loginToken(studentA.email)

    expect(await lessonText(lessons.th.id, token)).not.toContain(SECRET)
    expect(await (await rest('/lessons', { token })).text()).not.toContain(SECRET)
    expect(await (await graphql(`{ Lesson(id: ${lessons.th.id}) { steps { step1 } } }`, token)).text()).not.toContain(
      SECRET,
    )

    const local = await payload.findByID({
      collection: 'lessons',
      id: lessons.th.id,
      overrideAccess: false,
      user: asUser(studentA),
    })
    expect(JSON.stringify(local)).not.toContain(SECRET)
    expect(await canAccessLesson({ payload, user: studentA, lessonId: lessons.th.id })).toBe(false)
  })

  it('không dò được nội dung bằng điều kiện lọc trên các bước', async () => {
    const token = await loginToken(studentA.email)
    const response = await rest(`/lessons?where[steps.step1][like]=${SECRET}`, { token })
    const text = await response.text()

    expect(text).not.toContain(SECRET)
    if (response.status === 200) expect(JSON.parse(text).docs).toHaveLength(0)
  })

  it('response của người có quyền không lộ sang request khác (không cache theo bài)', async () => {
    await buy(studentA, singleTh)
    const tokenA = await loginToken(studentA.email)
    const tokenB = await loginToken(studentB.email)

    expect(await lessonText(lessons.th.id, tokenA)).toContain(SECRET)
    expect(await lessonText(lessons.th.id)).not.toContain(SECRET)
    expect(await lessonText(lessons.th.id, tokenB)).not.toContain(SECRET)
    expect(await lessonText(lessons.th.id, tokenA)).toContain(SECRET)
  })
})

describe('Mua riêng và gói có thời hạn', () => {
  it('đơn mới luôn "Chờ thanh toán" và chưa mở quyền; xác nhận thì mở đúng bài đã mua', async () => {
    const pending = await order(studentA, singleTh)

    expect(pending.status).toBe('pending')
    expect(pending.amount).toBe(99000)
    expect(await accessibleIds(studentA)).toEqual([])

    await confirm(pending)

    expect(await accessibleIds(studentA)).toEqual(ids('th'))
    const token = await loginToken(studentA.email)
    expect(await lessonText(lessons.th.id, token)).toContain(`${SECRET} th step9`)
    expect(await lessonText(lessons.r.id, token)).not.toContain(SECRET)
  })

  it('gói 1 tháng chỉ mở các bài trong gói, hết hạn sau đúng 1 tháng lịch', async () => {
    const paid = await buy(studentA, bundle)

    expect(await accessibleIds(studentA)).toEqual(ids('r', 'th', 't', 'hu', 'ch'))
    expect(await canAccessLesson({ payload, user: studentA, lessonId: lessons.tr.id })).toBe(false)

    const [grant] = (await grantsOf(studentA)).docs
    expect(grant.startsAt).toBe(paid.paidAt)
    expect(grant.endsAt).toBe(addCalendarMonths(new Date(paid.paidAt!), 1).toISOString())

    // Hết hạn tính theo giờ server lúc kiểm tra, không cần cron đổi trạng thái
    const afterExpiry = new Date(new Date(grant.endsAt!).getTime() + 1000)
    expect(await accessibleIds(studentA, afterExpiry)).toEqual([])
    expect(grant.status).toBe('active')
  })

  it('gói tháng hết hạn không làm mất quyền mua riêng của cùng bài', async () => {
    await buy(studentA, singleTh)
    await buy(studentA, bundle)

    const bundleGrant = (await grantsOf(studentA)).docs.find((grant) => grant.source === 'order' && grant.endsAt)!
    // Đưa gói tháng về quá khứ (như khi đã hết hạn)
    await payload.update({
      collection: 'subscriptions',
      id: bundleGrant.id,
      ...adminCtx(),
      data: { startsAt: '2026-01-01T00:00:00.000Z', endsAt: '2026-02-01T00:00:00.000Z' },
    })

    expect(await accessibleIds(studentA)).toEqual(ids('th'))
    const token = await loginToken(studentA.email)
    expect(await lessonText(lessons.th.id, token)).toContain(SECRET)
    expect(await lessonText(lessons.r.id, token)).not.toContain(SECRET)
  })

  it('sửa gói sau khi bán không đổi quyền đã kích hoạt (bản chụp)', async () => {
    await buy(studentA, bundle)

    await payload.update({
      collection: 'plans',
      id: bundle.id,
      ...adminCtx(),
      data: { lessons: [lessons.tr.id], durationMonths: 6 },
    })

    expect(await accessibleIds(studentA)).toEqual(ids('r', 'th', 't', 'hu', 'ch'))
    const [grant] = (await grantsOf(studentA)).docs
    expect((grant.snapshot as { durationMonths: number }).durationMonths).toBe(1)
  })

  it('hoàn tiền thu hồi quyền của đúng đơn đó', async () => {
    const paid = await buy(studentA, bundle)
    await buy(studentA, singleTh)

    await payload.update({ collection: 'orders', id: paid.id, ...adminCtx(), data: { status: 'refunded' } })

    expect(await accessibleIds(studentA)).toEqual(ids('th'))
    const revoked = (await grantsOf(studentA)).docs.find((grant) => grant.order === paid.id)!
    expect(revoked.status).toBe('revoked')
  })
})

describe('Xác nhận thanh toán an toàn', () => {
  it('xác nhận lặp lại không tạo quyền trùng', async () => {
    const pending = await order(studentA, bundle)
    await confirm(pending)
    await confirm(pending)

    expect((await grantsOf(studentA)).totalDocs).toBe(1)
  })

  it('hai lần xác nhận đồng thời chỉ tạo một quyền học', async () => {
    const pending = await order(studentA, bundle)
    await Promise.allSettled([confirm(pending), confirm(pending)])

    expect((await grantsOf(studentA)).totalDocs).toBe(1)
    expect((await payload.findByID({ collection: 'orders', id: pending.id })).status).toBe('paid')
  })

  it('chuyển trạng thái không hợp lệ bị từ chối', async () => {
    const paid = await buy(studentA, bundle)

    await expect(
      payload.update({ collection: 'orders', id: paid.id, ...adminCtx(), data: { status: 'pending' } }),
    ).rejects.toThrow()

    const pending = await order(studentA, singleTh)
    await expect(
      payload.update({ collection: 'orders', id: pending.id, ...adminCtx(), data: { status: 'paid' } }),
    ).rejects.toThrow(/phương thức thanh toán/)
  })

  it('không đặt được gói ngừng bán; không tạo trùng đơn đang chờ cho cùng gói', async () => {
    await order(studentA, bundle)
    await expect(order(studentA, bundle)).rejects.toThrow(/đang chờ thanh toán/)

    await payload.update({ collection: 'plans', id: singleTh.id, ...adminCtx(), data: { isActive: false } })
    await expect(order(studentA, singleTh)).rejects.toThrow(/ngừng bán/)
  })
})

describe('Người dùng không tự cấp quyền được', () => {
  it('không tạo quyền học, không tự xác nhận đơn (REST, GraphQL, Local API)', async () => {
    const token = await loginToken(studentA.email)

    const created = await rest('/subscriptions', {
      method: 'POST',
      token,
      body: { user: studentA.id, source: 'manual', lessons: ids('th'), noExpiry: true },
    })
    expect(created.status).toBe(403)

    const pending = await order(studentA, bundle)
    const patched = await rest(`/orders/${pending.id}`, { method: 'PATCH', token, body: { status: 'paid' } })
    expect(patched.status).toBe(403)

    const gql = await graphql(
      `mutation { createSubscription(data: { user: ${studentA.id}, source: manual, noExpiry: true }) { id } }`,
      token,
    )
    expect((await gql.json()).errors?.length).toBeGreaterThan(0)

    await expect(
      payload.create({
        collection: 'subscriptions',
        overrideAccess: false,
        user: asUser(studentA),
        data: { user: studentA.id, source: 'manual', status: 'active', lessons: ids('th'), noExpiry: true },
      }),
    ).rejects.toThrow()

    expect((await grantsOf(studentA)).totalDocs).toBe(0)
    expect((await payload.findByID({ collection: 'orders', id: pending.id })).status).toBe('pending')
  })

  it('tạo đơn qua REST với trạng thái/giá/người mua giả: server bỏ qua, đơn vẫn chờ thanh toán', async () => {
    const token = await loginToken(studentA.email)

    const response = await rest('/orders', {
      method: 'POST',
      token,
      body: { plan: bundle.id, status: 'paid', amount: 0, user: studentB.id, paidAt: new Date().toISOString() },
    })
    expect(response.status).toBe(201)

    const { doc } = (await response.json()) as { doc: Order }
    expect(doc.status).toBe('pending')
    expect(doc.amount).toBe(399000)
    expect(typeof doc.user === 'object' ? doc.user.id : doc.user).toBe(studentA.id)
    expect(doc.paidAt ?? null).toBeNull()
    expect((await grantsOf(studentA)).totalDocs + (await grantsOf(studentB)).totalDocs).toBe(0)
  })

  it('không xem được đơn/quyền của người khác bằng cách đổi ID', async () => {
    const paid = await buy(studentA, bundle)
    const [grant] = (await grantsOf(studentA)).docs
    const tokenB = await loginToken(studentB.email)

    expect((await rest(`/orders/${paid.id}`, { token: tokenB })).status).not.toBe(200)
    expect((await rest(`/subscriptions/${grant.id}`, { token: tokenB })).status).not.toBe(200)

    const ordersB = (await (await rest('/orders', { token: tokenB })).json()) as { docs: Order[] }
    const grantsB = (await (await rest('/subscriptions', { token: tokenB })).json()) as { docs: Subscription[] }
    expect(ordersB.docs).toHaveLength(0)
    expect(grantsB.docs).toHaveLength(0)

    // Chủ sở hữu đọc được của mình; người dùng không đọc được nhật ký
    const tokenA = await loginToken(studentA.email)
    expect((await rest(`/orders/${paid.id}`, { token: tokenA })).status).toBe(200)
    expect((await rest('/audit-logs', { token: tokenA })).status).toBe(403)
  })
})

describe('Trạng thái tài khoản và chính sách theo vai trò', () => {
  it('học sinh bị chuyển pending mất quyền dù còn gói; giáo viên pending không xem được', async () => {
    await buy(studentA, bundle)
    await payload.update({ collection: 'users', id: studentA.id, data: { accountStatus: 'pending' } })

    expect(await accessibleIds(studentA)).toEqual([])
    expect(await accessibleIds(pendingTeacher)).toEqual([])
  })

  it('giáo viên active và Admin xem được mọi bài (chính sách riêng)', async () => {
    expect(await accessibleIds(teacher)).toBe('all')
    expect(await accessibleIds(admin)).toBe('all')

    const token = await loginToken(teacher.email)
    expect(await lessonText(lessons.tr.id, token)).toContain(SECRET)
  })

  it('khách và Giáo viên không tạo được đơn', async () => {
    expect((await rest('/orders', { method: 'POST', body: { plan: bundle.id } })).status).toBe(403)
    await expect(order(teacher, bundle)).rejects.toThrow()
  })
})

describe('Admin quản lý gói và quyền', () => {
  it('cấp quyền thủ công theo gói (tự lấy bài và thời hạn), thu hồi được, có nhật ký', async () => {
    const grant = await payload.create({
      collection: 'subscriptions',
      ...adminCtx(),
      data: { user: studentB.id, source: 'manual', plan: bundle.id, startsAt: '2028-01-31T03:00:00.000Z' } as never,
    })

    expect(grant.lessons).toHaveLength(5)
    // 31/01/2028 10:00 giờ VN + 1 tháng = 29/02/2028 (năm nhuận)
    expect(grant.endsAt).toBe('2028-02-29T03:00:00.000Z')

    const during = new Date('2028-02-15T00:00:00.000Z')
    expect(await accessibleIds(studentB, during)).toEqual(ids('r', 'th', 't', 'hu', 'ch'))

    await payload.update({
      collection: 'subscriptions',
      id: grant.id,
      ...adminCtx(),
      data: { status: 'revoked', statusReason: 'Thử thu hồi' },
    })
    expect(await accessibleIds(studentB, during)).toEqual([])

    const { docs: logs } = await payload.find({
      collection: 'audit-logs',
      pagination: false,
      where: { relatedUser: { equals: studentB.id } },
    })
    expect(logs.map((log) => log.action).sort()).toEqual(['create', 'update'])
    expect(logs.every((log) => log.actor === admin.id || (log.actor as User)?.id === admin.id)).toBe(true)
  })

  it('cấp thủ công không chọn gói phải chọn rõ hạn hoặc "Không thời hạn"', async () => {
    await expect(
      payload.create({
        collection: 'subscriptions',
        ...adminCtx(),
        data: { user: studentB.id, source: 'manual', lessons: ids('tr') } as never,
      }),
    ).rejects.toThrow(/Không thời hạn/)

    await payload.create({
      collection: 'subscriptions',
      ...adminCtx(),
      data: { user: studentB.id, source: 'manual', lessons: ids('tr'), noExpiry: true } as never,
    })
    expect(await accessibleIds(studentB)).toEqual(ids('tr'))
  })

  it('xác nhận thanh toán ghi người xác nhận, thời điểm và nhật ký', async () => {
    const paid = await buy(studentA, singleTh)

    expect(paid.confirmedBy === admin.id || (paid.confirmedBy as User)?.id === admin.id).toBe(true)
    expect(paid.paidAt).toBeTruthy()

    const { docs: logs } = await payload.find({
      collection: 'audit-logs',
      pagination: false,
      where: { targetCollection: { equals: 'orders' } },
    })
    expect(logs.some((log) => JSON.stringify(log.changes).includes('"to":"paid"'))).toBe(true)
  })

  it('không tạo được quyền nguồn "Đơn mua" bằng tay; gói mua riêng phải có đúng một bài', async () => {
    await expect(
      payload.create({
        collection: 'subscriptions',
        ...adminCtx(),
        data: { user: studentA.id, source: 'order', lessons: ids('th'), noExpiry: true } as never,
      }),
    ).rejects.toThrow(/xác nhận thanh toán/)

    await expect(
      createPlan({ name: 'Sai', code: 'sai', kind: 'single', price: 1, durationType: 'lifetime', lessons: ids('th', 'r') }),
    ).rejects.toThrow(/đúng một bài/)
  })
})
