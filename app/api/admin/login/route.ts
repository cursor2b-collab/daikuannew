import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = (formData.get('email') as string)?.trim()
    const password = formData.get('password') as string

    if (!email || !password) {
      return NextResponse.json(
        { code: 400, msg: '请输入邮箱和密码' },
        { status: 400 }
      )
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error || !authData?.session) {
      return NextResponse.json(
        { code: 401, msg: error?.message === 'Invalid login credentials' ? '邮箱或密码错误' : (error?.message || '登录失败') },
        { status: 401 }
      )
    }

    const session = authData.session
    const sessionPayload = {
      access_token: session.access_token,
      refresh_token: session.refresh_token ?? '',
      expires_at: session.expires_at
    }

    const cookieStore = await cookies()
    cookieStore.set('admin_session', JSON.stringify(sessionPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 天
    })

    return NextResponse.json({
      code: 200,
      msg: '登录成功',
      data: {
        id: authData.user.id,
        email: authData.user.email,
        login_time: new Date().toISOString()
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
