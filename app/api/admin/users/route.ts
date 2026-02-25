import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// 检查管理员登录状态
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')
  
  if (!sessionCookie?.value) {
    return null
  }

  try {
    const sessionData = JSON.parse(sessionCookie.value)
    const { data: admin } = await supabase
      .from('admin_users')
      .select('id, username, status')
      .eq('id', sessionData.admin_id)
      .eq('status', 1)
      .single()
    
    return admin
  } catch {
    return null
  }
}

// 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth()
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
    const admin = await checkAdminAuth()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name, phone, id_number, loan_number, bank_card,
      amount, loan_date, overdue_days, overdue_amount,
      amount_due, is_settled, is_interest_free, payment_method
    } = body

    const { data, error } = await supabase
      .from('users')
      .insert({
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
      })
      .select()
      .single()

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
    console.error('Create user error:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '创建用户失败' },
      { status: 500 }
    )
  }
}
