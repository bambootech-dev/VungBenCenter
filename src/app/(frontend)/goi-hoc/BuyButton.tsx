'use client'

import React, { useActionState } from 'react'

import { createOrder } from '@/actions/createOrder'

export const BuyButton = ({ planId, planName }: { planId: number; planName: string }) => {
  const [state, action, pending] = useActionState(createOrder, null)

  return (
    <form action={action} className="d-grid gap-2">
      <input name="planId" type="hidden" value={planId} />
      <button aria-label={`Đặt mua ${planName}`} className="btn btn-primary btn-lg" disabled={pending} type="submit">
        {pending && <span aria-hidden="true" className="spinner-border spinner-border-sm me-2" />}
        {pending ? 'Đang tạo đơn...' : 'Đặt mua'}
      </button>
      {state?.error && (
        <div className="alert alert-danger small mb-0" role="alert">
          {state.error}
        </div>
      )}
    </form>
  )
}
