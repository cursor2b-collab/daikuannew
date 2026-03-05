import { NextRequest, NextResponse } from 'next/server'
import { supabase, hasServiceRoleKey } from '@/lib/supabase'
import { getAdminFromCookie } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 构建查询
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 筛选条件
    const search = searchParams.get('search')
    const isSettled = searchParams.get('is_settled')
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,loan_number.ilike.%${search}%`)
    }
    
    if (isSettled !== null && isSettled !== '') {
      query = query.eq('is_settled', isSettled === 'true')
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: {
        list: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '获取用户列表失败' },
      { status: 500 }
    )
  }
}

// 创建用户
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }
    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        { code: 503, msg: '服务未配置 SUPABASE_SERVICE_ROLE_KEY，无法写入数据库。请在 Vercel/环境变量中配置后重试。' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const {
      name, phone, id_number, loan_number, bank_card,
      amount, loan_date, due_date, overdue_days, overdue_amount,
      amount_due, is_settled, is_interest_free, payment_method,
      repayment_months, penalty_fee, interest
    } = body

    const basePayload: Record<string, unknown> = {
      name,
      phone,
      id_number,
      loan_number,
      bank_card,
      amount: amount ? parseFloat(amount) : 0,
      loan_date: loan_date || null,
      overdue_days: overdue_days ? parseInt(overdue_days) : 0,
      overdue_amount: overdue_amount ? parseFloat(overdue_amount) : 0,
      amount_due: amount_due ? parseFloat(amount_due) : 0,
      is_settled: is_settled || false,
      is_interest_free: is_interest_free || false,
      payment_method: payment_method || null,
      repayment_months: repayment_months != null && repayment_months !== '' ? parseInt(repayment_months) : null,
      updated_at: new Date().toISOString()
    }
    const payloadWithOptional = { ...basePayload }
    if (due_date !== undefined && due_date !== '') payloadWithOptional.due_date = due_date
    if (penalty_fee !== undefined && penalty_fee !== '') payloadWithOptional.penalty_fee = parseFloat(penalty_fee)
    if (interest !== undefined && interest !== '') payloadWithOptional.interest = parseFloat(interest)

    let result = await supabase.from('users').insert(payloadWithOptional).select().single()
    if (result.error && /column.*does not exist|undefined_column/i.test(String(result.error.message))) {
      const fallbackPayload: Record<string, unknown> = {
        name,
        phone,
        id_number,
        loan_number,
        bank_card,
        amount: amount ? parseFloat(amount) : 0,
        loan_date: loan_date || null,
        overdue_days: overdue_days ? parseInt(overdue_days) : 0,
        overdue_amount: overdue_amount ? parseFloat(overdue_amount) : 0,
        amount_due: amount_due ? parseFloat(amount_due) : 0,
        is_settled: is_settled || false,
        is_interest_free: is_interest_free || false,
        payment_method: payment_method || null,
        updated_at: new Date().toISOString()
      }
      result = await supabase.from('users').insert(fallbackPayload).select().single()
    }
    const { data, error } = result

    if (error) {
      throw error
    }

    // 自动生成验证码
    if (data && phone) {
      const code = Math.floor(100000 + Math.random() * 900000).toString() // 6位数字验证码
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 10) // 10分钟后过期

      await supabase
        .from('verification_codes')
        .insert({
          user_id: data.id,
          phone: phone,
          code: code,
          used: false,
          expires_at: expiresAt.toISOString()
        })
    }

    return NextResponse.json({
      code: 200,
      msg: '创建成功',
      data
    })
  } catch (error: any) {
    const msg = error?.message || (typeof error === 'string' ? error : '创建用户失败')
    console.error('Create user error:', error)
    if (error?.code === '42501' || /permission denied|policy|RLS/i.test(String(msg))) {
      return NextResponse.json(
        { code: 503, msg: '数据库权限不足，请配置 SUPABASE_SERVICE_ROLE_KEY 后重试。' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { code: 500, msg: msg },
      { status: 500 }
    )
  }
}
