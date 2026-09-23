import Link from 'next/link'

export default function AccountPage() {
  return (
    <main style={styles.main}>
      <section style={styles.container}>
        <div style={styles.heading}>
          <p style={styles.eyebrow}>VỮNG BỀN CENTER</p>
          <h1 style={styles.title}>Chào mừng bạn</h1>
          <p style={styles.description}>
            Vui lòng chọn vai trò để đăng nhập hoặc tạo tài khoản.
          </p>
        </div>

        <div style={styles.grid}>
          {/* Giáo viên */}
          <article style={styles.card}>
            <div style={styles.icon}>GV</div>

            <h2 style={styles.cardTitle}>Giáo viên</h2>

            <p style={styles.cardDescription}>
              Truy cập khu vực quản lý dành cho Giáo viên.
            </p>

            <div style={styles.actions}>
              <Link
                href="/login/giaovien"
                style={styles.primaryButton}
              >
                Đăng nhập Giáo viên
              </Link>

              <Link
                href="/register/giaovien"
                style={styles.secondaryButton}
              >
                Đăng ký Giáo viên
              </Link>
            </div>

            <p style={styles.note}>
              Tài khoản Giáo viên cần được Admin phê duyệt.
            </p>
          </article>

          {/* Học sinh */}
          <article style={styles.card}>
            <div style={styles.icon}>HS</div>

            <h2 style={styles.cardTitle}>Học sinh</h2>

            <p style={styles.cardDescription}>
              Truy cập khu vực học tập dành cho Học sinh.
            </p>

            <div style={styles.actions}>
              <Link
                href="/login/hocsinh"
                style={styles.primaryButton}
              >
                Đăng nhập Học sinh
              </Link>

              <Link
                href="/register/hocsinh"
                style={styles.secondaryButton}
              >
                Đăng ký Học sinh
              </Link>
            </div>

            <p style={styles.note}>
              Học sinh có thể đăng nhập ngay sau khi đăng ký.
            </p>
          </article>
        </div>

        <p style={styles.adminText}>
          Bạn là quản trị viên?{' '}
          <Link href="/admin/login" style={styles.adminLink}>
            Đăng nhập Admin
          </Link>
        </p>
      </section>
    </main>
  )
}

const styles = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 20px',
    backgroundColor: '#080808',
    color: '#ffffff',
  },

  container: {
    width: '100%',
    maxWidth: '950px',
  },

  heading: {
    marginBottom: '40px',
    textAlign: 'center' as const,
  },

  eyebrow: {
    marginBottom: '12px',
    color: '#a3a3a3',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '2px',
  },

  title: {
    margin: '0 0 12px',
    fontSize: '42px',
  },

  description: {
    margin: 0,
    color: '#a3a3a3',
    fontSize: '16px',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },

  card: {
    padding: '32px',
    border: '1px solid #2c2c2c',
    borderRadius: '16px',
    backgroundColor: '#121212',
  },

  icon: {
    width: '52px',
    height: '52px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '24px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontWeight: 800,
  },

  cardTitle: {
    margin: '0 0 10px',
    fontSize: '24px',
  },

  cardDescription: {
    minHeight: '48px',
    margin: '0 0 24px',
    color: '#a3a3a3',
    lineHeight: 1.6,
  },

  actions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },

  primaryButton: {
    padding: '13px 18px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontWeight: 700,
    textAlign: 'center' as const,
    textDecoration: 'none',
  },

  secondaryButton: {
    padding: '13px 18px',
    border: '1px solid #444444',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#ffffff',
    fontWeight: 700,
    textAlign: 'center' as const,
    textDecoration: 'none',
  },

  note: {
    margin: '18px 0 0',
    color: '#777777',
    fontSize: '13px',
    lineHeight: 1.5,
  },

  adminText: {
    marginTop: '32px',
    color: '#888888',
    textAlign: 'center' as const,
  },

  adminLink: {
    color: '#ffffff',
    fontWeight: 700,
  },
}