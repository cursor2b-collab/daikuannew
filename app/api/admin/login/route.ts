import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase, md5Hash } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    if (!username || !password) {
      return NextResponse.json(
        { code: 400, msg: '请输入用户名和密码' },
        { status: 400 }
      )
    }

    // 查询管理员用户
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('status', 1)
      .single()

    if (error || !admin) {
      return NextResponse.json(
        { code: 401, msg: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 验证密码（使用MD5哈希）
    const passwordHash = md5Hash(password)
    if (admin.password !== passwordHash) {
      return NextResponse.json(
        { code: 401, msg: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 更新登录时间和登录次数
    await supabase
      .from('admin_users')
      .update({
        login_at: new Date().toISOString(),
        login_num: (admin.login_num || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', admin.id)

    // 创建会话数据
    const sessionData = {
      admin_id: admin.id,
      username: admin.username,
      login_time: new Date().toISOString()
    }

    // 设置cookie
    const cookieStore = await cookies()
    cookieStore.set('admin_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7天
    })

    return NextResponse.json({
      code: 200,
      msg: '登录成功',
      data: {
        id: admin.id,
        username: admin.username,
        login_time: sessionData.login_time
      }
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { code: 500, msg: '登录失败，请重试' },
      { status: 500 }
    )
  }
}
