// @vitest-environment node
import { describe, expect, it } from 'vitest'

import {
  assertSafeDatabase,
  resolveDatabaseEnvironment,
  UnsafeDatabaseError,
} from '@/utilities/assertSafeDatabase'

// Chỉ dùng URL giả — không bao giờ đọc URL Supabase thật
const FAKE_SUPABASE_URL = 'postgresql://fake-user:fake-password@db.example.supabase.co:5432/postgres'
const local = (host: string, database: string) =>
  `postgresql://fake-user:fake-password@${host}:54329/${database}`

const DEV = { NODE_ENV: 'development' }
const TEST = { NODE_ENV: 'test' }
const PROD = { NODE_ENV: 'production' }

const blockedMessage = (url: string | undefined, env: Record<string, string>) => {
  try {
    assertSafeDatabase(url, env)
  } catch (error) {
    expect(error).toBeInstanceOf(UnsafeDatabaseError)
    return (error as Error).message
  }

  throw new Error('Expected the guard to block this database')
}

describe('Database guard — development', () => {
  it('1. cho phép 127.0.0.1/vbc_dev', () => {
    expect(assertSafeDatabase(local('127.0.0.1', 'vbc_dev'), DEV).target).toEqual({
      hostname: '127.0.0.1',
      port: '54329',
      database: 'vbc_dev',
    })
  })

  it('2. cho phép localhost/vbc_dev (và ::1)', () => {
    expect(assertSafeDatabase(local('localhost', 'vbc_dev'), DEV).environment).toBe('development')
    expect(assertSafeDatabase(local('[::1]', 'vbc_dev'), DEV).target.hostname).toBe('::1')
  })

  it('3. chặn vbc_test', () => {
    expect(blockedMessage(local('127.0.0.1', 'vbc_test'), DEV)).toContain('Database: vbc_test')
  })

  it('4. chặn Supabase host', () => {
    const message = blockedMessage(FAKE_SUPABASE_URL, DEV)

    expect(message).toContain('Blocked unsafe database connection.')
    expect(message).toContain('Environment: development')
    expect(message).toContain('Host: db.example.supabase.co')
    expect(message).toContain('Database: postgres')
  })

  it('5. remote host + ALLOW_REMOTE_DATABASE=true vẫn bị chặn', () => {
    blockedMessage(FAKE_SUPABASE_URL, { ...DEV, ALLOW_REMOTE_DATABASE: 'true' })
    blockedMessage(FAKE_SUPABASE_URL, { ALLOW_REMOTE_DATABASE: 'true' })
  })

  it('NODE_ENV không đặt được coi là development', () => {
    expect(resolveDatabaseEnvironment({})).toBe('development')
    blockedMessage(local('127.0.0.1', 'vbc_test'), {})
  })

  it('chặn host giống local nhưng là remote', () => {
    blockedMessage(local('localhost.example.supabase.co', 'vbc_dev'), DEV)
    blockedMessage(local('127.0.0.1.nip.io', 'vbc_dev'), DEV)
  })

  it('chặn query parameter ghi đè host hoặc database', () => {
    expect(
      blockedMessage(`${local('127.0.0.1', 'vbc_dev')}?host=db.example.supabase.co`, DEV),
    ).toContain('(host)')
    blockedMessage(`${local('127.0.0.1', 'vbc_dev')}?sslmode=disable&hostaddr=10.0.0.1`, DEV)
    blockedMessage(`${local('127.0.0.1', 'vbc_dev')}?dbname=postgres`, DEV)
  })
})

describe('Database guard — test', () => {
  it('6. cho phép 127.0.0.1/vbc_test', () => {
    expect(assertSafeDatabase(local('127.0.0.1', 'vbc_test'), TEST).environment).toBe('test')
  })

  it('7. chặn vbc_dev', () => {
    expect(blockedMessage(local('127.0.0.1', 'vbc_dev'), TEST)).toContain('Environment: test')
  })

  it('8. chặn Supabase host (kể cả có ALLOW_REMOTE_DATABASE=true)', () => {
    blockedMessage(FAKE_SUPABASE_URL, TEST)
    blockedMessage(FAKE_SUPABASE_URL, { ...TEST, ALLOW_REMOTE_DATABASE: 'true' })
  })

  it('next dev do Playwright khởi động (VBC_DATABASE_ENV=test) chỉ nhận vbc_test', () => {
    const playwrightDev = { NODE_ENV: 'development', VBC_DATABASE_ENV: 'test' }

    expect(assertSafeDatabase(local('127.0.0.1', 'vbc_test'), playwrightDev).environment).toBe(
      'test',
    )
    blockedMessage(local('127.0.0.1', 'vbc_dev'), playwrightDev)
    blockedMessage(FAKE_SUPABASE_URL, playwrightDev)
  })
})

describe('Database guard — production', () => {
  it('9. remote mà thiếu ALLOW_REMOTE_DATABASE bị chặn', () => {
    expect(blockedMessage(FAKE_SUPABASE_URL, PROD)).toContain('ALLOW_REMOTE_DATABASE=true')
    blockedMessage(FAKE_SUPABASE_URL, { ...PROD, ALLOW_REMOTE_DATABASE: '1' })
  })

  it('10. remote + ALLOW_REMOTE_DATABASE=true được phép', () => {
    const { url, environment } = assertSafeDatabase(FAKE_SUPABASE_URL, {
      ...PROD,
      ALLOW_REMOTE_DATABASE: 'true',
    })

    expect(environment).toBe('production')
    expect(url).toBe(FAKE_SUPABASE_URL)
  })

  it('local database được phép cho bản build production chạy trên máy', () => {
    expect(assertSafeDatabase(local('127.0.0.1', 'vbc_dev'), PROD).environment).toBe('production')
  })
})

describe('Database guard — URL thiếu hoặc không hợp lệ', () => {
  it('11. URL không hợp lệ bị chặn', () => {
    expect(blockedMessage('not a url', DEV)).toContain('not a valid URL')
    blockedMessage('mysql://fake-user:fake-password@127.0.0.1:3306/vbc_dev', DEV)
    blockedMessage('not a url', { ...PROD, ALLOW_REMOTE_DATABASE: 'true' })
  })

  it('12. URL bị thiếu bị chặn', () => {
    expect(blockedMessage(undefined, DEV)).toContain('DATABASE_URL is missing')
    blockedMessage('', TEST)
    blockedMessage(undefined, { ...PROD, ALLOW_REMOTE_DATABASE: 'true' })
  })

  it('13. thông báo lỗi không chứa username, password hay connection string', () => {
    const cases: [string | undefined, Record<string, string>][] = [
      [FAKE_SUPABASE_URL, DEV],
      [FAKE_SUPABASE_URL, TEST],
      [FAKE_SUPABASE_URL, PROD],
      [`${local('127.0.0.1', 'vbc_dev')}?host=db.example.supabase.co`, DEV],
      ['postgresql://fake-user:fake-password@%zz/vbc_dev', DEV],
      ['postgresql://fake-user:fake-password@', DEV],
    ]

    for (const [url, env] of cases) {
      const message = blockedMessage(url, env)

      expect(message).not.toContain('fake-password')
      expect(message).not.toContain('fake-user')
      expect(message).not.toContain('postgresql://')
    }
  })
})
