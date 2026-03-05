import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAdminFromCookie } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name, phone, id_number, loan_number, bank_card,
      amount, loan_date, due_date, overdue_days, overdue_amount,
      amount_due, is_settled, is_interest_free, payment_method,
      annual_rate, repayment_months, daily_penalty, penalty_fee, interest
    } = body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (id_number !== undefined) updateData.id_number = id_number
    if (loan_number !== undefined) updateData.loan_number = loan_number
    if (bank_card !== undefined) updateData.bank_card = bank_card
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (loan_date !== undefined) updateData.loan_date = loan_date || null
    if (due_date !== undefined) updateData.due_date = due_date || null
    if (overdue_days !== undefined) updateData.overdue_days = parseInt(overdue_days) || 0
    if (overdue_amount !== undefined) updateData.overdue_amount = parseFloat(overdue_amount) || 0
    if (amount_due !== undefined) updateData.amount_due = parseFloat(amount_due) || 0
    if (is_settled !== undefined) updateData.is_settled = is_settled
    if (is_interest_free !== undefined) updateData.is_interest_free = is_interest_free
    if (payment_method !== undefined) updateData.payment_method = payment_method
    if (annual_rate !== undefined) updateData.annual_rate = parseFloat(annual_rate) || 10.88
    if (repayment_months !== undefined) updateData.repayment_months = repayment_months ? parseInt(repayment_months) : null
    if (daily_penalty !== undefined) updateData.daily_penalty = parseFloat(daily_penalty) || 0
    if (penalty_fee !== undefined) updateData.penalty_fee = penalty_fee !== '' && penalty_fee != null ? parseFloat(penalty_fee) : null
    if (interest !== undefined) updateData.interest = interest !== '' && interest != null ? parseFloat(interest) : null

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', parseInt(params.id))
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      code: 200,
      msg: '更新成功',
      data
    })
  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '更新用户失败' },
      { status: 500 }
    )
  }
}

// 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', parseInt(params.id))

    if (error) {
      throw error
    }

    return NextResponse.json({
      code: 200,
      msg: '删除成功'
    })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '删除用户失败' },
      { status: 500 }
    )
  }
}
