import { NextRequest, NextResponse } from 'next/server'
import { supabase, hasServiceRoleKey } from '@/lib/supabase'
import { getAdminFromCookie } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// 为所有用户生成验证码（每人新增一条，与登录校验一致：phone 需与用户输入一致，过期时间 24 小时）
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
    const msg = error?.message || '生成验证码失败'
    if (error?.code === '42501' || /permission denied|policy|RLS/i.test(String(msg))) {
      return NextResponse.json(
        { code: 503, msg: '数据库权限不足，请配置 SUPABASE_SERVICE_ROLE_KEY 后重试。' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { code: 500, msg },
      { status: 500 }
    )
  }
}
