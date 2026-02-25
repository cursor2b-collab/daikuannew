import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { md5Hash } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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

// 获取管理员列表
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: {
        list: data || []
      }
    })
  } catch (error: any) {
    console.error('Get admins error:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '获取管理员列表失败' },
      { status: 500 }
    )
  }
}

// 创建管理员
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ code: 400, msg: '请输入用户名和密码' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ code: 400, msg: '密码长度至少6位' }, { status: 400 })
    }

    // 检查用户名是否已存在
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('username', username)
      .single()

    if (existingAdmin) {
      return NextResponse.json({ code: 400, msg: '用户名已存在' }, { status: 400 })
    }

    // 创建管理员（密码使用MD5加密）
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        username,
        password: md5Hash(password),
        status: 1
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      code: 200,
      msg: '创建成功',
      data
    })
  } catch (error: any) {
    console.error('Create admin error:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '创建管理员失败' },
      { status: 500 }
    )
  }
}
