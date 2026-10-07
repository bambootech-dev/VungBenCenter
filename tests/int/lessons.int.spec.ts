// @vitest-environment node
import config from '@payload-config'
import { GRAPHQL_POST } from '@payloadcms/next/routes'
import { getPayload, handleEndpoints, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { formatSoundLabel, normalizeSound } from '@/collections/Lessons/sound'
import { LESSON_STEP_COUNT, LESSON_STEP_KEYS, parseLessonStep } from '@/collections/Lessons/steps'
import type { Lesson, User } from '@/payload-types'

import { assertConnectedToLocalTestDatabase } from '../helpers/localTestDatabase'

// Chỉ chạy trên database local trong .env.test (guard trong vitest.setup.ts)

let payload: Payload

const PASSWORD = 'MatKhau123!'

// Chuỗi đánh dấu nội dung bài học: không được xuất hiện trong bất kỳ phản hồi nào cho khách
const SECRET_CONTENT = 'NOI-DUNG-BAI-HOC-CHI-DANH-CHO-HOC-VIEN'

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
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
        ],
      },
    ],
  },
})

const lessonData = (sound: string, order: number) => ({
  sound,
  order,
  steps: Object.fromEntries(
    LESSON_STEP_KEYS.map((key, index) => [key, richText(`${SECRET_CONTENT} ${sound} bước ${index + 1}`)]),
  ),
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

const countLessons = async () =>
  (await payload.count({ collection: 'lessons', overrideAccess: true })).totalDocs

let admin: User
let student: User
let pendingTeacher: User
let activeTeacher: User
let lesson: Lesson

beforeAll(async () => {
  payload = await getPayload({ config })
  await assertConnectedToLocalTestDatabase(payload.db)
})

afterAll(async () => {
  await payload.db.deleteMany({ collection: 'lessons', where: {} })
})

beforeEach(async () => {
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
    data: lessonData('tr', 1),
  })
})

describe('Khách (chưa đăng nhập)', () => {
  it('GET /api/lessons không nhận được bài học nào', async () => {
    const response = await rest('/lessons')
    const text = await response.text()

    expect(response.status).toBe(403)
    expect(JSON.parse(text).docs).toBeUndefined()
    expect(text).not.toContain(SECRET_CONTENT)
    expect(text).not.toContain('"sound"')
  })

  it('GET /api/lessons/:id không nhận được bài học', async () => {
    const response = await rest(`/lessons/${lesson.id}`)
    const text = await response.text()

    expect(response.status).toBe(403)
    expect(text).not.toContain(SECRET_CONTENT)
    expect(text).not.toContain('"sound"')
  })

  it('không lấy được bài học bằng ?depth, ?select hay ?where', async () => {
    for (const query of ['?depth=2', '?select[sound]=true', `?where[id][equals]=${lesson.id}`]) {
      const response = await rest(`/lessons${query}`)
      const text = await response.text()

      expect(response.status).toBe(403)
      expect(text).not.toContain(SECRET_CONTENT)
    }
  })

  it('GraphQL không trả nội dung bài học', async () => {
    const response = await graphql(`{
      Lessons { docs { id sound steps { step1 } } }
      Lesson(id: ${lesson.id}) { id sound steps { step1 step9 } }
    }`)
    const text = await response.text()
    const body = JSON.parse(text)

    expect(body.errors?.length).toBeGreaterThan(0)
    expect(body.data?.Lessons ?? null).toBeNull()
    expect(body.data?.Lesson ?? null).toBeNull()
    expect(text).not.toContain(SECRET_CONTENT)
  })

  it('Local API với overrideAccess: false và không có user bị từ chối', async () => {
    await expect(payload.find({ collection: 'lessons', overrideAccess: false })).rejects.toThrow()
  })

  it('không create/update/delete được bài học qua REST', async () => {
    const created = await rest('/lessons', { method: 'POST', body: lessonData('ch', 2) })
    expect(created.status).toBe(403)

    const updated = await rest(`/lessons/${lesson.id}`, {
      method: 'PATCH',
      body: { sound: 'bị-sửa' },
    })
    expect(updated.status).toBe(403)
    expect(await updated.text()).not.toContain(SECRET_CONTENT)

    const deleted = await rest(`/lessons/${lesson.id}`, { method: 'DELETE' })
    expect(deleted.status).toBe(403)
    expect(await deleted.text()).not.toContain(SECRET_CONTENT)

    const after = await payload.findByID({ collection: 'lessons', id: lesson.id })
    expect(after.sound).toBe('tr')
    expect(await countLessons()).toBe(1)
  })

  it('không create/update/delete được bài học qua GraphQL mutation', async () => {
    const response = await graphql(`mutation {
      createLesson(data: { sound: "ch", order: 2 }) { id }
      updateLesson(id: ${lesson.id}, data: { sound: "bị-sửa" }) { id sound steps { step1 } }
      deleteLesson(id: ${lesson.id}) { id sound steps { step1 } }
    }`)
    const text = await response.text()
    const body = JSON.parse(text)

    expect(body.errors?.length).toBe(3)
    expect(text).not.toContain(SECRET_CONTENT)

    const after = await payload.findByID({ collection: 'lessons', id: lesson.id })
    expect(after.sound).toBe('tr')
    expect(await countLessons()).toBe(1)
  })
})

describe('Học sinh không active', () => {
  it('Học sinh bị chuyển sang pending không đọc được bài học (REST và Local API)', async () => {
    const token = await loginToken(student.email)

    await payload.update({
      collection: 'users',
      id: student.id,
      data: { accountStatus: 'pending' },
      overrideAccess: false,
      user: asUser(admin),
    })

    const response = await rest(`/lessons/${lesson.id}`, { token })
    const text = await response.text()
    expect(response.status).toBe(403)
    expect(text).not.toContain(SECRET_CONTENT)

    await expect(
      payload.find({
        collection: 'lessons',
        overrideAccess: false,
        user: asUser({ ...student, accountStatus: 'pending' }),
      }),
    ).rejects.toThrow()
  })
})

describe('Học sinh active', () => {
  it('đọc được danh sách và chi tiết bài học qua REST', async () => {
    const token = await loginToken(student.email)

    const list = await rest('/lessons', { token })
    expect(list.status).toBe(200)
    const { docs } = (await list.json()) as { docs: Lesson[] }
    expect(docs.map((doc) => doc.sound)).toEqual(['tr'])

    const detail = await rest(`/lessons/${lesson.id}`, { token })
    expect(detail.status).toBe(200)
    expect(JSON.stringify(await detail.json())).toContain(`${SECRET_CONTENT} tr bước 9`)
  })

  it('đọc được bài học qua GraphQL', async () => {
    const token = await loginToken(student.email)

    const response = await graphql(`{ Lesson(id: ${lesson.id}) { sound steps { step1 } } }`, token)
    const body = await response.json()

    expect(body.errors).toBeUndefined()
    expect(body.data.Lesson.sound).toBe('tr')
    expect(JSON.stringify(body.data.Lesson.steps.step1)).toContain(SECRET_CONTENT)
  })

  it('đọc được qua Local API với overrideAccess: false', async () => {
    const result = await payload.findByID({
      collection: 'lessons',
      id: lesson.id,
      overrideAccess: false,
      user: asUser(student),
    })

    expect(result.sound).toBe('tr')
  })

  it('không create/update/delete được bài học (REST)', async () => {
    const token = await loginToken(student.email)

    const created = await rest('/lessons', { method: 'POST', token, body: lessonData('ch', 2) })
    expect(created.status).toBe(403)

    const updated = await rest(`/lessons/${lesson.id}`, {
      method: 'PATCH',
      token,
      body: { sound: 'bị-sửa' },
    })
    expect(updated.status).toBe(403)

    const deleted = await rest(`/lessons/${lesson.id}`, { method: 'DELETE', token })
    expect(deleted.status).toBe(403)

    const after = await payload.findByID({ collection: 'lessons', id: lesson.id })
    expect(after.sound).toBe('tr')
    expect(await countLessons()).toBe(1)
  })

  it('không create/update/delete được bài học (Local API, overrideAccess: false)', async () => {
    const user = asUser(student)

    await expect(
      payload.create({ collection: 'lessons', data: lessonData('ch', 2), overrideAccess: false, user }),
    ).rejects.toThrow()
    await expect(
      payload.update({
        collection: 'lessons',
        id: lesson.id,
        data: { sound: 'bị-sửa' },
        overrideAccess: false,
        user,
      }),
    ).rejects.toThrow()
    await expect(
      payload.delete({ collection: 'lessons', id: lesson.id, overrideAccess: false, user }),
    ).rejects.toThrow()

    expect(await countLessons()).toBe(1)
  })
})

describe('Giáo viên', () => {
  it('Giáo viên pending không đọc được bài học', async () => {
    await expect(
      payload.find({ collection: 'lessons', overrideAccess: false, user: asUser(pendingTeacher) }),
    ).rejects.toThrow()

    await expect(
      payload.findByID({
        collection: 'lessons',
        id: lesson.id,
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

    const response = await rest(`/lessons/${lesson.id}`, { token })
    const text = await response.text()

    expect(response.status).toBe(403)
    expect(text).not.toContain(SECRET_CONTENT)
  })

  it('Giáo viên active đọc được bài học', async () => {
    const token = await loginToken(activeTeacher.email)

    const response = await rest(`/lessons/${lesson.id}`, { token })

    expect(response.status).toBe(200)
    expect(((await response.json()) as Lesson).sound).toBe('tr')
  })

  it('Giáo viên active không sửa được bài học', async () => {
    const token = await loginToken(activeTeacher.email)

    const response = await rest(`/lessons/${lesson.id}`, {
      method: 'PATCH',
      token,
      body: { sound: 'bị-sửa' },
    })

    expect(response.status).toBe(403)
  })
})

describe('Admin', () => {
  it('create/update/delete được bài học qua REST', async () => {
    const token = await loginToken(admin.email)

    const created = await rest('/lessons', { method: 'POST', token, body: lessonData('ch', 2) })
    expect(created.status).toBe(201)
    const { doc } = (await created.json()) as { doc: Lesson }
    expect(doc.sound).toBe('ch')

    const updated = await rest(`/lessons/${doc.id}`, {
      method: 'PATCH',
      token,
      body: { sound: 'nh', steps: { step5: richText('Nội dung bước 5 đã sửa') } },
    })
    expect(updated.status).toBe(200)

    const afterUpdate = await payload.findByID({ collection: 'lessons', id: doc.id })
    expect(afterUpdate.sound).toBe('nh')
    expect(JSON.stringify(afterUpdate.steps?.step5)).toContain('Nội dung bước 5 đã sửa')
    // Sửa một bước không làm mất các bước còn lại
    expect(JSON.stringify(afterUpdate.steps?.step1)).toContain(`${SECRET_CONTENT} ch bước 1`)

    const deleted = await rest(`/lessons/${doc.id}`, { method: 'DELETE', token })
    expect(deleted.status).toBe(200)
    expect(await countLessons()).toBe(1)
  })

  it('create/update/delete được bài học qua Local API với overrideAccess: false', async () => {
    const user = asUser(admin)

    const created = await payload.create({
      collection: 'lessons',
      data: lessonData('ng', 3),
      overrideAccess: false,
      user,
    })
    const updated = await payload.update({
      collection: 'lessons',
      id: created.id,
      data: { order: 0 },
      overrideAccess: false,
      user,
    })
    expect(updated.order).toBe(0)

    await payload.delete({ collection: 'lessons', id: created.id, overrideAccess: false, user })
    expect(await countLessons()).toBe(1)
  })
})

describe('Schema bài học', () => {
  it('có đúng 9 bước Rich Text cố định trong group steps', () => {
    const collection = payload.collections.lessons.config
    const steps = collection.fields.find((field) => 'name' in field && field.name === 'steps')

    expect(steps?.type).toBe('group')
    expect(LESSON_STEP_COUNT).toBe(9)

    const stepFields = steps && 'fields' in steps ? steps.fields : []
    expect(stepFields.map((field) => ('name' in field ? field.name : null))).toEqual([
      ...LESSON_STEP_KEYS,
    ])
    expect(stepFields.every((field) => field.type === 'richText')).toBe(true)
  })

  it('chỉ có các field sound, order, thumbnail, steps', () => {
    const fields = payload.collections.lessons.config.fields
      .filter((field) => 'name' in field)
      .map((field) => ('name' in field ? field.name : null))

    expect(fields.filter((name) => !['id', 'updatedAt', 'createdAt'].includes(name ?? ''))).toEqual([
      'sound',
      'order',
      'thumbnail',
      'steps',
    ])
  })

  it('không lưu được bước thứ 10', async () => {
    const token = await loginToken(admin.email)

    const response = await rest(`/lessons/${lesson.id}`, {
      method: 'PATCH',
      token,
      body: { steps: { step10: richText('BUOC-10-KHONG-DUOC-LUU') } },
    })
    expect(response.status).toBe(200)

    const after = await payload.findByID({ collection: 'lessons', id: lesson.id })
    expect(Object.keys(after.steps ?? {}).sort()).toEqual([...LESSON_STEP_KEYS].sort())
    expect(JSON.stringify(after)).not.toContain('BUOC-10-KHONG-DUOC-LUU')
  })

  it('REST mặc định sắp xếp theo order tăng dần (defaultSort)', async () => {
    await payload.create({ collection: 'lessons', overrideAccess: true, data: lessonData('ch', 3) })
    await payload.create({ collection: 'lessons', overrideAccess: true, data: lessonData('nh', 2) })

    const response = await rest('/lessons', { token: await loginToken(student.email) })
    const { docs } = (await response.json()) as { docs: Lesson[] }

    expect(docs.map((doc) => doc.sound)).toEqual(['tr', 'nh', 'ch'])
  })

  it('danh sách sắp xếp theo order tăng dần', async () => {
    await payload.create({ collection: 'lessons', overrideAccess: true, data: lessonData('ch', 3) })
    await payload.create({ collection: 'lessons', overrideAccess: true, data: lessonData('nh', 2) })

    const { docs } = await payload.find({
      collection: 'lessons',
      overrideAccess: false,
      sort: 'order',
      user: asUser(student),
    })

    expect(docs.map((doc) => doc.sound)).toEqual(['tr', 'nh', 'ch'])
  })

  it.each([
    [undefined, 1],
    ['', 1],
    ['abc', 1],
    ['0', 1],
    ['-3', 1],
    ['1', 1],
    ['5', 5],
    ['9', 9],
    ['10', 9],
    ['999', 9],
    [['4', '7'], 4],
  ])('parseLessonStep(%j) = %i', (value, expected) => {
    expect(parseLessonStep(value)).toBe(expected)
  })
})

describe('Quy ước tên âm', () => {
  it.each([
    ['Th', 'Th'],
    ['  Tr  ', 'Tr'],
    ['Âm Th', 'Th'],
    ['âm   ch', 'ch'],
    ['ÂM Ng', 'Ng'],
    ['Âm Âm Nh', 'Nh'],
    // "Âm" gõ bằng ký tự tổ hợp (NFD) vẫn được nhận ra
    ['Âm Gh', 'Gh'],
  ])('Admin nhập %j → database lưu %j', async (input, stored) => {
    const created = await payload.create({
      collection: 'lessons',
      data: { sound: input, order: 5 },
      overrideAccess: false,
      user: asUser(admin),
    })

    expect(created.sound).toBe(stored)
    expect(formatSoundLabel(created.sound)).toBe(`Âm ${stored}`)
  })

  it('sửa tên âm cũng được chuẩn hóa', async () => {
    const updated = await payload.update({
      collection: 'lessons',
      id: lesson.id,
      data: { sound: 'Âm Tr' },
      overrideAccess: false,
      user: asUser(admin),
    })

    expect(updated.sound).toBe('Tr')
  })

  it('formatSoundLabel không bao giờ tạo "Âm Âm"', () => {
    expect(formatSoundLabel('Th')).toBe('Âm Th')
    // Dữ liệu cũ lưu trước khi có chuẩn hóa
    expect(formatSoundLabel('Âm Th')).toBe('Âm Th')
    expect(normalizeSound('Âm')).toBe('Âm')
  })
})
