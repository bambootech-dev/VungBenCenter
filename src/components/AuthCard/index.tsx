import React from 'react'

type Props = {
  children: React.ReactNode
  onSubmit: React.FormEventHandler<HTMLFormElement>
  title: string
}

/** Khung form đăng nhập/đăng ký: card giữa trang, rộng tối đa ~440px. */
export const AuthCard = ({ children, onSubmit, title }: Props) => (
  <div className="container py-5 my-md-4">
    <div className="row justify-content-center">
      <div className="col-12 col-sm-10 col-md-7 col-lg-5">
        <form className="card shadow-sm" onSubmit={onSubmit}>
          <div className="card-body p-4 p-sm-5">
            <p className="badge bg-primary-subtle text-primary-emphasis fs-6 mb-2">Vững Bền Center</p>
            <h1 className="h2 mb-4">{title}</h1>
            {children}
          </div>
        </form>
      </div>
    </div>
  </div>
)
