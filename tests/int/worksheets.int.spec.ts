// @vitest-environment node
import config from '@payload-config'
import { GRAPHQL_POST } from '@payloadcms/next/routes'
import { getPayload, handleEndpoints, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  findDuplicateQuestionKeys,
  normalizeQuestionKey,
  validateQuestionKey,
} from '@/collections/Worksheets/questions'
import type { Lesson, User, Worksheet } from '@/payload-types'

import { assertConnectedToLocalTestDatabase } from '../helpers/localTestDatabase'

// Chỉ chạy trên database local trong .env.test (guard trong vitest.setup.ts)

let payload: Payload

const PASSWORD = 'MatKhau123!'

// Chuỗi đánh dấu nội dung worksheet: không được xuất hiện trong phản hồi cho người không có quyền
const SECRET_CONTENT = 'NOI-DUNG-WORKSHEET-CHI-DANH-CHO-GIAO-VIEN'

const worksheetData = (title: string, lessonId?: number) => ({
  title,
  instructions: `${SECRET_CONTENT} hướng dẫn`,
  lesson: lessonId,
  questions: [
    { key: 'cau-1', label: `${SECRET_CONTENT} câu 1`, required: true },
    { key: 'cau-2', label: 'Câu 2', required: false },
  ],
})

type CreateUserInput = Pick<User, 'role' | 'accountStatus'> & { email: string }

const createUser = ({ email, role, accountStatus }: CreateUserInput) =>
  payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { name: email, email, password: PASSWORD, role, accountStatus },
  })

const loginToken = async (email: string) => {
  const { token } = await payload.login({
    collection: 'users',
    data: { email, password: PASSWORD },
  })

  if (!token) throw new Error(`Không lấy được token cho ${email}`)

  return token
}

const asUser = (user: User) => ({ ...user, collection: 'users' as const })

const authHeaders = (token?: string): Record<string, string> =>
  token ? { Authorization: `JWT ${token}` } : {}

const rest = (
  path: string,
  { body, method = 'GET', token }: { body?: unknown; method?: string; token?: string } = {},
) =>
  handleEndpoints({
    config,
    request: new Request(`http://localhost:3000/api${path}`, {
      method,
      headers: {
        ...authHeaders(token),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
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

const countWorksheets = async () =>
  (await payload.count({ collection: 'worksheets', overrideAccess: true })).totalDocs

// Payload trả lỗi validation dạng { errors: [{ data: { errors: [{ path, message }] } }] }
const validationMessages = async (response: Response) => {
  const body = (await response.json()) as {
    errors?: { data?: { errors?: { message: string; path: string }[] } }[]
  }

  return (body.errors ?? []).flatMap((error) => error.data?.errors ?? [])
}

let admin: User
let student: User
let pendingTeacher: User
let activeTeacher: User
let lesson: Lesson
let worksheet: Worksheet

beforeAll(async () => {
  payload = await getPayload({ config })
  await assertConnectedToLocalTestDatabase(payload.db)
})

afterAll(async () => {
  await payload.db.deleteMany({ collection: 'worksheets', where: {} })
  await payload.db.deleteMany({ collection: 'lessons', where: {} })
})

beforeEach(async () => {
  await payload.db.deleteMany({ collection: 'worksheets', where: {} })
  await payload.db.deleteMany({ collection: 'lessons', where: {} })
  await payload.db.deleteMany({ collection: 'users', where: {} })

  admin = await createUser({ email: 'admin@test.local', role: 'admin', accountStatus: 'active' })
  student = await createUser({ email: 'hs@test.local', role: 'hocsinh', accountStatus: 'active' })
  pendingTeacher = await createUser({
    email: 'gv-pending@test.local',
    role: 'giaovien',
    accountStatus: 'pending',
  })
  activeTeacher = await createUser({
    email: 'gv-active@test.local',
    role: 'giaovien',
    accountStatus: 'active',
  })

  lesson = await payload.create({
    collection: 'lessons',
    overrideAccess: true,
    data: { sound: 'tr', order: 1 },
  })

  worksheet = await payload.create({
    collection: 'worksheets',
    overrideAccess: true,
    data: worksheetData('Worksheet mẫu', lesson.id),
  })
})

describe('Đăng ký collection', () => {
  it('collection worksheets được đăng ký với các field title, instructions, lesson, questions', () => {
    const collection = payload.collections.worksheets?.config
    expect(collection).toBeDefined()

    const fields = collection!.fields
      .filter((field) => 'name' in field)
      .map((field) => ('name' in field ? field.name : null))

    expect(fields.filter((name) => !['id', 'updatedAt', 'createdAt'].includes(name ?? ''))).toEqual([
      'title',
      'instructions',
      'lesson',
      'questions',
    ])
  })

  it('lesson trỏ tới collection lessons thật', () => {
    const lessonField = payload.collections.worksheets.config.fields.find(
      (field) => 'name' in field && field.name === 'lesson',
    )

    expect(lessonField?.type).toBe('relationship')
    expect(lessonField && 'relationTo' in lessonField ? lessonField.relationTo : null).toBe('lessons')
  })

  it('lưu bền vững và đọc lại được câu hỏi, bài học liên kết, thời gian tạo/cập nhật', async () => {
    const saved = await payload.findByID({ collection: 'worksheets', id: worksheet.id, depth: 1 })

    expect(saved.title).toBe('Worksheet mẫu')
    expect(saved.questions.map(({ key, required }) => ({ key, required }))).toEqual([
      { key: 'cau-1', required: true },
      { key: 'cau-2', required: false },
    ])
    expect(saved.questions.every((question) => typeof question.id === 'string')).toBe(true)
    expect(typeof saved.lesson === 'object' && saved.lesson?.id).toBe(lesson.id)
    expect(saved.createdAt).toBeTruthy()
    expect(saved.updatedAt).toBeTruthy()
  })
})

describe('Khách (chưa đăng nhập)', () => {
  it('REST không đọc được danh sách hay chi tiết worksheet', async () => {
    for (const path of ['/worksheets', `/worksheets/${worksheet.id}`, '/worksheets?depth=2']) {
      const response = await rest(path)
      const text = await response.text()

      expect(response.status).toBe(403)
      expect(text).not.toContain(SECRET_CONTENT)
    }
  })

  it('GraphQL không trả worksheet', async () => {
    const response = await graphql(`{
      Worksheets { docs { id title questions { key label } } }
      Worksheet(id: ${worksheet.id}) { id title instructions }
    }`)
    const text = await response.text()
    const body = JSON.parse(text)

    expect(body.errors?.length).toBeGreaterThan(0)
    expect(body.data?.Worksheets ?? null).toBeNull()
    expect(body.data?.Worksheet ?? null).toBeNull()
    expect(text).not.toContain(SECRET_CONTENT)
  })

  it('Local API với overrideAccess: false và không có user bị từ chối', async () => {
    await expect(payload.find({ collection: 'worksheets', overrideAccess: false })).rejects.toThrow()
  })

  it('không create/update/delete được worksheet qua REST', async () => {
    expect((await rest('/worksheets', { method: 'POST', body: worksheetData('Mới') })).status).toBe(403)
    expect(
      (await rest(`/worksheets/${worksheet.id}`, { method: 'PATCH', body: { title: 'Bị sửa' } }))
        .status,
    ).toBe(403)
    expect((await rest(`/worksheets/${worksheet.id}`, { method: 'DELETE' })).status).toBe(403)

    const after = await payload.findByID({ collection: 'worksheets', id: worksheet.id })
    expect(after.title).toBe('Worksheet mẫu')
    expect(await countWorksheets()).toBe(1)
  })
})

describe('Học sinh / Phụ huynh', () => {
  it('Học sinh active không đọc được worksheet (REST và Local API)', async () => {
    const token = await loginToken(student.email)

    for (const path of ['/worksheets', `/worksheets/${worksheet.id}`]) {
      const response = await rest(path, { token })
      expect(response.status).toBe(403)
      expect(await response.text()).not.toContain(SECRET_CONTENT)
    }

    await expect(
      payload.find({ collection: 'worksheets', overrideAccess: false, user: asUser(student) }),
    ).rejects.toThrow()
  })
})

describe('Giáo viên', () => {
  it('Giáo viên pending không đọc được worksheet', async () => {
    await expect(
      payload.find({
        collection: 'worksheets',
        overrideAccess: false,
        user: asUser(pendingTeacher),
      }),
    ).rejects.toThrow()
  })

  it('token cấp khi còn active mất quyền đọc ngay khi tài khoản chuyển sang pending', async () => {
    const token = await loginToken(activeTeacher.email)

    await payload.update({
      collection: 'users',
      id: activeTeacher.id,
      data: { accountStatus: 'pending' },
      overrideAccess: false,
      user: asUser(admin),
    })

    const response = await rest(`/worksheets/${worksheet.id}`, { token })
    expect(response.status).toBe(403)
    expect(await response.text()).not.toContain(SECRET_CONTENT)
  })

  it('Giáo viên active đọc được danh sách và chi tiết worksheet (REST, GraphQL, Local API)', async () => {
    const token = await loginToken(activeTeacher.email)

    const list = await rest('/worksheets', { token })
    expect(list.status).toBe(200)
    const { docs } = (await list.json()) as { docs: Worksheet[] }
    expect(docs.map((doc) => doc.id)).toEqual([worksheet.id])

    const detail = await rest(`/worksheets/${worksheet.id}`, { token })
    expect(detail.status).toBe(200)
    expect(((await detail.json()) as Worksheet).questions.map((q) => q.key)).toEqual([
      'cau-1',
      'cau-2',
    ])

    const response = await graphql(`{ Worksheet(id: ${worksheet.id}) { title questions { key } } }`, token)
    const body = await response.json()
    expect(body.errors).toBeUndefined()
    expect(body.data.Worksheet.title).toBe('Worksheet mẫu')

    const local = await payload.find({
      collection: 'worksheets',
      overrideAccess: false,
      user: asUser(activeTeacher),
    })
    expect(local.totalDocs).toBe(1)
  })

  it('Giáo viên active không create/update/delete được worksheet', async () => {
    const token = await loginToken(activeTeacher.email)

    expect((await rest('/worksheets', { method: 'POST', token, body: worksheetData('Mới') })).status).toBe(403)
    expect(
      (
        await rest(`/worksheets/${worksheet.id}`, {
          method: 'PATCH',
          token,
          body: { title: 'Bị sửa' },
        })
      ).status,
    ).toBe(403)
    expect((await rest(`/worksheets/${worksheet.id}`, { method: 'DELETE', token })).status).toBe(403)

    const response = await graphql(
      `mutation { updateWorksheet(id: ${worksheet.id}, data: { title: "Bị sửa" }) { id } }`,
      token,
    )
    expect((await response.json()).errors?.length).toBe(1)

    const after = await payload.findByID({ collection: 'worksheets', id: worksheet.id })
    expect(after.title).toBe('Worksheet mẫu')
    expect(await countWorksheets()).toBe(1)
  })
})

describe('Admin', () => {
  it('create/read/update/delete được worksheet qua REST', async () => {
    const token = await loginToken(admin.email)

    const created = await rest('/worksheets', { method: 'POST', token, body: worksheetData('Mới') })
    expect(created.status).toBe(201)
    const { doc } = (await created.json()) as { doc: Worksheet }

    const read = await rest(`/worksheets/${doc.id}`, { token })
    expect(read.status).toBe(200)

    const updated = await rest(`/worksheets/${doc.id}`, {
      method: 'PATCH',
      token,
      body: {
        title: 'Đã sửa',
        questions: [...doc.questions, { key: 'cau-3', label: 'Câu 3', required: true }],
      },
    })
    expect(updated.status).toBe(200)

    const afterUpdate = await payload.findByID({ collection: 'worksheets', id: doc.id })
    expect(afterUpdate.title).toBe('Đã sửa')
    expect(afterUpdate.questions.map((q) => q.key)).toEqual(['cau-1', 'cau-2', 'cau-3'])
    // Sửa worksheet giữ nguyên id của các câu hỏi cũ
    expect(afterUpdate.questions.slice(0, 2).map((q) => q.id)).toEqual(doc.questions.map((q) => q.id))

    const deleted = await rest(`/worksheets/${doc.id}`, { method: 'DELETE', token })
    expect(deleted.status).toBe(200)
    expect(await countWorksheets()).toBe(1)
  })

  it('create/update/delete được worksheet qua Local API với overrideAccess: false', async () => {
    const user = asUser(admin)

    const created = await payload.create({
      collection: 'worksheets',
      overrideAccess: false,
      user,
      data: worksheetData('Mới'),
    })
    await payload.update({
      collection: 'worksheets',
      id: created.id,
      overrideAccess: false,
      user,
      data: { title: 'Đã sửa' },
    })
    await payload.delete({ collection: 'worksheets', id: created.id, overrideAccess: false, user })

    expect(await countWorksheets()).toBe(1)
  })
})

describe('Validation', () => {
  const createAsAdmin = async (data: Record<string, unknown>) =>
    rest('/worksheets', { method: 'POST', token: await loginToken(admin.email), body: data })

  it('bắt buộc có tiêu đề; tiêu đề chỉ có khoảng trắng bị từ chối', async () => {
    for (const title of [undefined, '', '   ']) {
      const response = await createAsAdmin({ ...worksheetData('x'), title })
      expect(response.status).toBe(400)
      expect((await validationMessages(response)).map((e) => e.path)).toContain('title')
    }
  })

  it('tiêu đề và nhãn câu hỏi được bỏ khoảng trắng đầu/cuối', async () => {
    const response = await createAsAdmin({
      title: '  Tiêu đề  ',
      questions: [{ key: '  CAU-1 ', label: '  Câu 1  ' }],
    })
    expect(response.status).toBe(201)
    const { doc } = (await response.json()) as { doc: Worksheet }

    expect(doc.title).toBe('Tiêu đề')
    expect(doc.questions[0]).toMatchObject({ key: 'cau-1', label: 'Câu 1', required: false })
  })

  it('phải có ít nhất một câu hỏi', async () => {
    for (const questions of [undefined, []]) {
      const response = await createAsAdmin({ title: 'Không có câu hỏi', questions })
      expect(response.status).toBe(400)
      expect((await validationMessages(response)).map((e) => e.path)).toContain('questions')
    }
  })

  it('mỗi câu hỏi phải có mã và nhãn', async () => {
    const response = await createAsAdmin({
      title: 'Thiếu dữ liệu',
      questions: [{ key: '', label: 'Có nhãn' }, { key: 'co-ma', label: '  ' }],
    })
    expect(response.status).toBe(400)

    const paths = (await validationMessages(response)).map((e) => e.path)
    expect(paths).toContain('questions.0.key')
    expect(paths).toContain('questions.1.label')
  })

  it('mã câu hỏi sai định dạng bị từ chối', async () => {
    for (const key of ['câu-1', 'cau 1', 'cau.1', 'a'.repeat(65)]) {
      const response = await createAsAdmin({ title: 'Sai mã', questions: [{ key, label: 'Câu' }] })
      expect(response.status).toBe(400)
      expect((await validationMessages(response)).map((e) => e.path)).toContain('questions.0.key')
    }
  })

  it('mã câu hỏi trùng trong cùng worksheet bị từ chối, kể cả khác hoa/thường', async () => {
    const response = await createAsAdmin({
      title: 'Trùng mã',
      questions: [
        { key: 'cau-1', label: 'Câu 1' },
        { key: 'CAU-1', label: 'Câu 1 lặp' },
      ],
    })
    expect(response.status).toBe(400)

    const errors = await validationMessages(response)
    expect(errors.find((e) => e.path === 'questions')?.message).toContain('cau-1')
    expect(await countWorksheets()).toBe(1)
  })

  it('sửa worksheet thành mã trùng cũng bị từ chối', async () => {
    const response = await rest(`/worksheets/${worksheet.id}`, {
      method: 'PATCH',
      token: await loginToken(admin.email),
      body: {
        questions: [
          { key: 'cau-1', label: 'Câu 1' },
          { key: 'cau-1', label: 'Câu 2' },
        ],
      },
    })
    expect(response.status).toBe(400)

    const after = await payload.findByID({ collection: 'worksheets', id: worksheet.id })
    expect(after.questions.map((q) => q.key)).toEqual(['cau-1', 'cau-2'])
  })

  it('hai worksheet khác nhau được dùng cùng mã câu hỏi', async () => {
    const response = await createAsAdmin(worksheetData('Worksheet thứ hai'))
    expect(response.status).toBe(201)
  })

  it('không liên kết được tới bài học không tồn tại', async () => {
    const response = await createAsAdmin({ ...worksheetData('Sai bài học'), lesson: 999999 })
    expect(response.status).toBe(400)
    expect((await validationMessages(response)).map((e) => e.path)).toContain('lesson')
    expect(await countWorksheets()).toBe(1)
  })

  it('xóa bài học không xóa worksheet, chỉ bỏ liên kết', async () => {
    await payload.delete({ collection: 'lessons', id: lesson.id, overrideAccess: true })

    const after = await payload.findByID({ collection: 'worksheets', id: worksheet.id })
    expect(after.lesson ?? null).toBeNull()
  })
})

describe('Hàm kiểm tra mã câu hỏi', () => {
  it('chuẩn hóa: bỏ khoảng trắng, chữ thường', () => {
    expect(normalizeQuestionKey('  Muc-Tieu_1 ')).toBe('muc-tieu_1')
  })

  it('validateQuestionKey chỉ nhận a-z, 0-9, "-" và "_"', () => {
    expect(validateQuestionKey('muc-tieu_1')).toBe(true)
    expect(validateQuestionKey('mục-tiêu')).not.toBe(true)
    expect(validateQuestionKey('muc tieu')).not.toBe(true)
  })

  it('findDuplicateQuestionKeys bỏ qua mã trống và trả mỗi mã trùng một lần', () => {
    expect(
      findDuplicateQuestionKeys([{ key: 'a' }, { key: 'b' }, { key: 'a' }, { key: 'a' }, { key: '' }, { key: '' }]),
    ).toEqual(['a'])
    expect(findDuplicateQuestionKeys(undefined)).toEqual([])
  })
})
