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

// 为所有用户生成验证码
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    // 获取所有有手机号但还没有验证码的用户
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

    // 获取已存在的验证码用户ID
    const { data: existingCodes } = await supabase
      .from('verification_codes')
      .select('user_id')
      .not('user_id', 'is', null)

    const existingUserIds = new Set((existingCodes || []).map((c: any) => c.user_id))

    // 为没有验证码的用户生成验证码
    const codesToInsert = []
    for (const user of users) {
      if (!existingUserIds.has(user.id) && user.phone) {
        const code = Math.floor(100000 + Math.random() * 900000).toString() // 6位数字验证码
        const expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + 10) // 10分钟后过期

        codesToInsert.push({
          user_id: user.id,
          phone: user.phone,
          code: code,
          used: false,
          expires_at: expiresAt.toISOString()
        })
      }
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
      msg: '生成成功',
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
