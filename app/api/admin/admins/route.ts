import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAdminFromCookie } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// 获取管理员列表（Supabase Auth 用户）
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 500 })

    if (error) {
      throw error
    }

    const list = (data?.users || []).map((u) => ({
      id: u.id,
      email: u.email,
      username: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at
    }))

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: { list }
    })
  } catch (error: unknown) {
    console.error('Get admins error:', error)
    return NextResponse.json(
      { code: 500, msg: error instanceof Error ? error.message : '获取管理员列表失败' },
      { status: 500 }
    )
  }
}

// 创建管理员（在 Supabase Auth 中创建用户，邮箱+密码）
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { email, password } = body
    const username = body.username ?? email

    const signUpEmail = email || username
    if (!signUpEmail || !password) {
      return NextResponse.json({ code: 400, msg: '请输入邮箱和密码' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ code: 400, msg: '密码长度至少6位' }, { status: 400 })
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: signUpEmail,
      password,
      email_confirm: true
    })

    if (error) {
      if (error.message?.includes('already been registered')) {
        return NextResponse.json({ code: 400, msg: '该邮箱已存在' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({
      code: 200,
      msg: '创建成功',
      data: {
        id: data.user?.id,
        email: data.user?.email,
        username: data.user?.email,
        created_at: data.user?.created_at
      }
    })
  } catch (error: unknown) {
    console.error('Create admin error:', error)
    return NextResponse.json(
      { code: 500, msg: error instanceof Error ? error.message : '创建管理员失败' },
      { status: 500 }
    )
  }
}
