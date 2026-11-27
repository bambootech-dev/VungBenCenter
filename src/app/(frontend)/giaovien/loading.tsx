export default function Loading() {
  return (
    <div className="container py-5" role="status">
      <p className="visually-hidden">Đang tải…</p>
      <div aria-hidden="true" className="placeholder-glow d-grid gap-4">
        <span className="placeholder col-6 col-md-4 placeholder-lg rounded" />
        {[0, 1, 2].map((index) => (
          <div className="card card-body py-4" key={index}>
            <span className="placeholder col-7 mb-2 rounded" />
            <span className="placeholder col-4 placeholder-sm rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
