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

// 为所有用户生成验证码（每人新增一条，与登录校验一致：phone 需与用户输入一致，过期时间 24 小时）
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, phone')
      .not('phone', 'is', null)
      .neq('phone', '')

    if (usersError) {
      throw usersError
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        code: 200,
        msg: '没有需要生成验证码的用户',
        data: { generated: 0 }
      })
    }

    const codesToInsert: { user_id: number; phone: string; code: string; used: boolean; expires_at: string }[] = []
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 100) // 100 年后过期，视为不过期

    for (const user of users) {
      if (!user.phone) continue
      const phone = String(user.phone).replace(/\D/g, '').trim()
      if (!phone || !/^1\d{10}$/.test(phone)) continue
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      codesToInsert.push({
        user_id: user.id,
        phone,
        code,
        used: false,
        expires_at: expiresAt.toISOString()
      })
    }

    if (codesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('verification_codes')
        .insert(codesToInsert)

      if (insertError) {
        throw insertError
      }
    }

    return NextResponse.json({
      code: 200,
      msg: '生成成功，验证码长期有效（不过期）',
      data: { generated: codesToInsert.length }
    })
  } catch (error: any) {
    console.error('Generate codes error:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '生成验证码失败' },
      { status: 500 }
    )
  }
}
